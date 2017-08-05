describe("A variable statement", function() {
  it("can define one variable", function() {
    var js = new JavaScriptParser();
    
    js.program("var a=1;");
    
    expect(js.global.a).toBe(1);
  });
  
  it("doesn't need to be initialized", function() {
    var js = new JavaScriptParser();
    
    expect(function() {
      js.program("var a;");
    }).not.toThrow();
    
  });
  
});
