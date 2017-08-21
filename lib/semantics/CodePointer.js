function CodePointer(code, debugging) {
  var that = Object.create(CodePointer.prototype);
  that._code = code;
  that._debugging = debugging;
  that._pointer = 0;
  that.heads = {};
  that.parseErrorDescription = {
    actuallCode: {
      length: Infinity,
    }
  };
  
  return that;
}

CodePointer.prototype
.matchAtPointer = function(regExp) {
  var match = regExp.exec(this.getUnparsed());

  this.reportMatch(regExp, match);
  if(match === null || match.index > 0) {
    return null;
  }
  
  this._pointer += match[0].length;
  return match;
};

CodePointer.prototype
.reportMatch = function(regExp, match) {
  var remainingLine = /.*/.exec(this.getUnparsed())[0];
  
  if(match === null || match.index > 0) {
    this.reportParseError(regExp);
    if(this._debugging) {
      console.log("%s.exec(\"%s\") // %s", regExp.toString(), remainingLine, 
      "null");
    }
  } else if(this._debugging) {
    console.log("%s.exec(\"%s\") // %s", regExp.toString(), remainingLine, 
    match[0]);
  }
};

CodePointer.prototype
.logParseStart = function(name) {
  if(this._debugging) {
    console.log("%s: parse start", name);
  }
};

CodePointer.prototype
.logParseEnd = function(name, parseSuccess) {
  var message 
  = parseSuccess ? "%s: parse success" : "%s: parse fail";
  if(this._debugging) {
    console.log(message, name);
  }
  
};

CodePointer.prototype
.backup = function() {
  return this._pointer;
};

CodePointer.prototype
.restore = function(backup) {
  this._pointer = backup;
};

CodePointer.prototype
.getUnparsed = function() {
  return this._code.slice(this._pointer);
};

CodePointer.prototype
.reportParseError = function(token) {
  var stripedToken = token.toString().slice(1, -1);
  var tokenAlternatives = stripedToken;
  var currentUnparsed = this.getUnparsed();
  var currentLength = currentUnparsed.length;
  var previousLength = this.parseErrorDescription.actuallCode.length;
  
  if(currentLength > previousLength) {
    return;
  }
  
  if(currentLength < previousLength) {
    this.parseErrorDescription.expectedAlternatives = undefined;
  }
  
  if(this.parseErrorDescription.expectedAlternatives) {
    tokenAlternatives = 
    this.parseErrorDescription.expectedAlternatives + "|" + stripedToken;
  }
  
  this.parseErrorDescription = {
    expectedAlternatives: tokenAlternatives,
    actuallCode: currentUnparsed,
  };

};

CodePointer.prototype
.getParseErrorDescription = function() {
  return "Expected /^" + this.parseErrorDescription.expectedAlternatives + 
  "/ to match '" + this.parseErrorDescription.actuallCode + "'.";
};
