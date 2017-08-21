function JavaScriptParser() {
  this.global = {};
}

(function() {
  var f = new InterpreterMethodFactory();
  var j = {};
  JavaScriptParser.prototype = j;
  
  j.statements = f.star("statement", function(statements) {
    
  });
  
  j.programInit = f.empty(function() {
    this.executionContext = this.global;
    this.outerContext = new Map();
    this.outerContext.set(this.executionContext, null);
  });
  
  j.program = f.group("programInit", "statements", 
  function(programInit, statements) {
    
  });
  
  j.statement = f.or(
    "variableStatement", "expressionStatement", "returnStatement");
    
  j.returnStatement = f.group(/return /, "assignmentExpression", 
  /;/, function(assignmentExpression) {
    this.returnValue = assignmentExpression;
  });
    
  j.expressionStatement = f.group("assignmentExpression", /;/, 
  function() {});
  
  j.variableStatement = f.group(/var /, "identifier", 
  "initialiserOpt", /;/, 
  function(identifier, initialiser) {
    this.executionContext[identifier] = initialiser;
  });
  
  j.identifier = f.atom(/([a-z])/, function(match) {
    return match;
  });
  
  j.numericLiteral = f.atom(/([0-9])/, function(match) {
    return Number(match);
  });
  
  j.initialiser = f.group(/=/, "assignmentExpression", 
  function(assignmentExpression) {
    return assignmentExpression;
  });
  
  j.assignmentExpression = f.or("numericLiteral", 
  "functionExpression", "callExpression", "assignmentExpression1");
  
  j.callExpression = f.group("identifier", /\(/, /\)/, 
  function(identifier) {
    this.executionContext[identifier]();
    return this.returnValue;
  });
  
  j.assignmentExpression1 = f.group("identifier", /=/, 
  "assignmentExpression", function(identifier, assignmentExpression) {
    var context = this.executionContext;
    if(!context.hasOwnProperty(identifier)) {
      context = this.outerContext.get(context);
    }
    context[identifier] = assignmentExpression;
    return assignmentExpression;
  });
  
  j.functionExpression = f.group(/function/, 
  /\(/, /\)/, /\{/, "functionBody", /\}/, function(functionBody) {
    var that = this;
    var outerExecutionContext = that.executionContext;
    var f = function() {
      var oldExecutionContext = that.executionContext;
      var executionContext = {};
      that.outerContext.set(executionContext, outerExecutionContext);
      that.executionContext = executionContext;
      functionBody(that);
      that.executionContext = oldExecutionContext;
    };
    return f;
  });
  
  j.functionBody = f.deferredExecution("statements");
  
  j.initialiserOpt = f.opt("initialiser", undefined);
  
})();
