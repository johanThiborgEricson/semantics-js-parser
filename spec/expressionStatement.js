describe("An expression statement", function() {
  it("can set the value of a declared variable", function() {
    var js = new JavaScriptParser();
    
    js.program("var a;a=1");
    expect(js.global.a).toBe(1);
  });
});
