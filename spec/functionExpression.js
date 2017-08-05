describe("A function expression", function() {
  
  it("returns a function", function() {
    var js = new JavaScriptParser();
    
    js.program("var f=function(){};");
    
    expect(js.global.f).toEqual(jasmine.any(Function));
  });
  
});
