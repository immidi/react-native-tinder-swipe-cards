/* Gratefully copied from https://github.com/brentvatne/react-native-animated-demo-tinder */
'use strict';

import React, { Component } from 'react';
import { StyleSheet, Text, View, Animated, PanResponder, Image, Dimensions} from 'react-native';
import clamp from 'clamp';

import Defaults from './Defaults.js';


const screenHeight = Dimensions.get('window').height;
var SWIPE_THRESHOLD = 120;

class SwipeCards extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pan: new Animated.ValueXY(),
      enter: new Animated.Value(0.8),
      card: this.props.cards[0],
      nextCard: this.props.cards[1]
    }
  }

  _goToNextCard() {
    let currentCardIdx = this.props.cards.indexOf(this.state.card);
    let newIdx = (currentCardIdx + 1);

    // Checks to see if last card.
    // If props.loop=true, will start again from the first card.


    let card = newIdx > this.props.cards.length - 1
      ? this.props.loop ? this.props.cards[0] : null
      : this.props.cards[newIdx];

    let nextCard =  newIdx > this.props.cards.length - 1
      ? this.props.loop ? this.props.cards[1] : null
      : newIdx+1 > this.props.cards.length - 1? this.props.cards[0] : this.props.cards[newIdx+1];


    this.setState({
      card: card,
      nextCard: nextCard
    });
  }

  componentDidMount() {
    this._animateEntrance();
  }

  _animateEntrance() {
    Animated.spring(
      this.state.enter,
      { toValue: 1, friction: 8 }
    ).start();
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (e, gestureState) => {
        this.state.pan.setOffset({x: this.state.pan.x._value, y: this.state.pan.y._value});
        this.state.pan.setValue({x: 0, y: 0});
      },

      onPanResponderMove: Animated.event([
        null, {dx: this.state.pan.x, dy: this.state.pan.y},
      ]),

      onPanResponderRelease: (e, {vx, vy}) => {
        this.state.pan.flattenOffset();
        var velocity;

        if (vy >= 0) {
          velocity = clamp(vy, 3, 5);
        } else if (vy < 0) {
          velocity = clamp(vy * -1, 3, 5) * -1;
        }

        if (Math.abs(this.state.pan.y._value) > SWIPE_THRESHOLD) {

          this.state.pan.y._value > 0
            ? this.props.handleYup(this.state.card)
            : this.props.handleNope(this.state.card)

          this.props.cardRemoved
            ? this.props.cardRemoved(this.props.cards.indexOf(this.state.card))
            : null

          Animated.decay(this.state.pan, {
            velocity: {x: vx, y: velocity},
            deceleration: 0.98
          }).start(this._resetState.bind(this))
        } else {
          Animated.spring(this.state.pan, {
            toValue: {x: 0, y: 0},
            friction: 4
          }).start()
        }
      }
    })
  }

  _resetState() {
    this.state.pan.setValue({x: 0, y: 0});
    this.state.enter.setValue(0);
    this._goToNextCard();
    this._animateEntrance();
  }

  renderNoMoreCards() {
    if (this.props.renderNoMoreCards)
      return this.props.renderNoMoreCards();

    return (
      <Defaults.NoMoreCards />
    )
  }

  renderCard(cardData) {
    return this.props.renderCard(cardData)
  }

  renderNextCard(cardData) {
    return this.props.renderNextCard(cardData)
  }

  render() {
    let { pan, enter, } = this.state;

    let [translateX, translateY] = [0, pan.y];

    let rotate = pan.y.interpolate({inputRange: [-20, 0, 20], outputRange: ["0deg", "0deg", "0deg"]});
    let opacity = pan.y.interpolate({inputRange: [-200, 0, 200], outputRange: [0.5, 1, 0.5]});
    let scale = pan.y.interpolate({inputRange: [1, 1], outputRange: [1, 1], extrapolate: 'clamp'});
    let animatedCardstyles = {transform: [{translateX}, {translateY}, {rotate}, {scale}], opacity};

    // Swipe down
    let yupOpacity = pan.y.interpolate({inputRange: [1, screenHeight], outputRange: [0.5, 1]});
    let yupScale = pan.y.interpolate({inputRange: [1, 150], outputRange: [1, 1], extrapolate: 'clamp'});
    let animatedYupStyles = {transform: [{scale: yupScale}], opacity: yupOpacity}

    // Swipe up
    let nopeOpacity = pan.y.interpolate({inputRange: [-screenHeight, 1], outputRange: [0.5, 1]});
    let nopeScale = pan.y.interpolate({inputRange: [-150, 1], outputRange: [1, 1], extrapolate: 'clamp'});
    let animatedNopeStyles = {transform: [{scale: nopeScale}], opacity: nopeOpacity}

    return (
      <View style={styles.container}>
        { this.state.card
          ? (
          <View>
            <View>
              {this.renderNextCard(this.state.nextCard)}
            </View>
            <Animated.View style={[styles.card, animatedCardstyles]} {...this._panResponder.panHandlers}>
              {this.renderCard(this.state.card)}
            </Animated.View>
          </View>
        )
          : this.renderNoMoreCards() }
      </View>
    );
  }
}

SwipeCards.propTypes = {
  cards: React.PropTypes.array,
  renderCards: React.PropTypes.func,
  loop: React.PropTypes.bool,
  renderNoMoreCards: React.PropTypes.func,
  showYup: React.PropTypes.bool,
  showNope: React.PropTypes.bool,
  handleYup: React.PropTypes.func,
  handleNope: React.PropTypes.func
};

SwipeCards.defaultProps = {
  loop: false,
  showYup: true,
  showNope: true
};


var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  yup: {
    borderColor: 'green',
    borderWidth: 2,
    position: 'absolute',
    padding: 20,
    bottom: 20,
    borderRadius: 5,
    right: 20,
  },
  yupText: {
    fontSize: 16,
    color: 'green',
  },
  nope: {
    borderColor: 'red',
    borderWidth: 2,
    position: 'absolute',
    bottom: 20,
    padding: 20,
    borderRadius: 5,
    left: 20,
  },
  nopeText: {
    fontSize: 16,
    color: 'red',
  }
});

export default SwipeCards
