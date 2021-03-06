// Generated by CoffeeScript 2.1.0
import React, {
  Component
} from 'react';

import {} from 'react-bootstrap';

import "./deck.css";

import MCProConsoleIdentifierCard from "./card";

export var MCProConsoleIdentifierDeck = class MCProConsoleIdentifierDeck extends Component {
  constructor() {
    super();
    this.state = {
      mode: 'text'
    };
  }

  render() {
    var deck;
    deck = this.props.deck;
    if (!deck) {
      return null;
    }
    if (typeof deck === 'string') {
      deck = MCProConsoleIdentifierDeck.loadFromString(deck, this.props.name);
    }
    return <div id="deck" className="deck">
            <label className="pull-right" id="deckname">{deck.name}</label>
            <label>主卡组：<b>{deck.main.length}</b></label>
            <div className={"line" + Math.ceil(deck.main.length / 4)}>
                {deck.main.map(function(card) {
      return <MCProConsoleIdentifierCard id={card} />;
    })}
            </div>
            <label>额外卡组：<b>{deck.ex.length}</b></label>
            <div className={"line" + deck.ex.length}>
                {deck.ex.map(function(card) {
      return <MCProConsoleIdentifierCard id={card} />;
    })}
            </div>
            {(deck.side && deck.side.length > 0 ? (<label>副卡组：<b>{deck.side.length}</b></label>, <div className={"line" + deck.side.length}>
                        {deck.side.map(function(card) {
      return <MCProConsoleIdentifierCard id={card} />;
    })}
                    </div>) : null)}
        </div>;
  }

};

MCProConsoleIdentifierDeck.loadFromString = function(str, name) {
  var deck, flag, id, line, lines;
  lines = str.split('\n');
  flag = 'main';
  deck = {
    name: name,
    main: [],
    side: [],
    ex: []
  };
  for (line of lines) {
    line = line.trim();
    if (line === '!side') {
      flag = 'side';
    } else if (line === '#extra') {
      flag = 'ex';
    } else {
      id = parseInt(line, 10);
      if (id > 0) {
        deck[flag].push(id);
      }
    }
  }
  return deck;
};

MCProConsoleIdentifierDeck.defaultProps = {
  name: "",
  deck: null
};

export default MCProConsoleIdentifierDeck;
