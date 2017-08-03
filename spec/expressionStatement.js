describe("An expression statement", function() {
  it("can set the value of a declared variable", function() {
    var global = {};
    var js = new JavaScriptParser(global);
    
    js.program("var a;a=1");
    expect(global.a).toBe(1);
  });
});
