# ECMAScript proposal: `do` expressions

This proposal has [preliminary spec text](https://tc39.github.io/proposal-do-expressions/).

## Status

This proposal is in **stage 1** of [the TC39 process](https://tc39.github.io/process-document/).

## Motivation

* expression-oriented programming one of the great advances of FP
* expressions plug together like legos, making more malleable programming experience in-the-small

## Examples

Write in an expression-oriented style, scoping variables as locally as possible:

```js
let x = do {
  let tmp = f();
  tmp * tmp + 1
};
```

Use conditional statements as expressions, instead of awkward nested ternaries:

```js
let x = do {
  if (foo()) { f() }
  else if (bar()) { g() }
  else { h() }
};
```

Especially nice for templating languages like JSX:

```js
return (
  <nav>
    <Home />
    {
      do {
        if (loggedIn) {
          <LogoutButton />
        } else {
          <LoginButton />
        }
      }
    }
  </nav>
)
```

## Limitations

Because of the potential for confusion, you can't end a do-expression with a declaration, an `if` without an `else`, or a loop (even when nested in other statements). For example, the following are all Early Errors:

```js
(do {
  let x = 1;
});
```

```js
(do {
  function f() {}
});
```

```js
(do {
  while (cond) {
    // do something
  }
});
```

```js
(do {
  if (condition) {
    while (inner) {
      // do something
    }
  } else {
    42;
  }
});
```

```js
(do {
  label: {
    let x = 1;
    break label;
  }
});
```

```js
(do {
  if (foo) {
    bar
  }
});
```


More formally, the completion value of the _StatementList_ can't rely on the completion value of a loop or declaration. See EndsInIterationOrDeclaration in the proposed specification for details.

The restriction on declarations is particularly unfortunate. It arises from the fact that declarations have `~empty~` as their completion value, meaning `do { 'before'; let x = 'after'; }` would evaluate to `before`. I'd like to pursue changing the completion value for declarations in general, which would affect existing code relying on `eval`.

## Edge cases

### `var` declarations

`var` declarations are allowed (except as the final statement), with the binding hoisting to the containing function's scope. Exception: `var` declarations are an Early Error when the `do` occurs in a parameter expression.

### Empty `do`

`do {}` is allowed and is equivalent to `void 0`.

### `await`/`yield`

The ability to use `await` and `yield` is inherited from the context of the enclosing function, as it is in any other expression.

### `throw`

Works fine. Does what you expect.

### `break`/`continue`/`return`

These are allowed when in an appropriate context: `return` is allowed when the `do` is within a function, `break` is allowed when within a loop or a switch case, etc. This allows you to write code like this:

```js
function getUserId(blob) {
  let obj = do {
    try {
      JSON.parse(blob)
    } catch {
      return null; // returns from the function
    }
  };
  return obj?.userId;
}
```

#### Exceptions

Because of the potential for confusion, unlabeled `break` and `continue` are not allowed within the head of a loop, whether or not the loop is within another loop.

`return` is allowed even within function parameter lists, as in `function f(x = do { return null; }) {}`. It is not allowed in computed property names in class bodies.

### Conflict with `do-while`

`do` expressions are prohibited in contexts in which statements are legal. In such contexts you can just use a normal block or enclose the `do` expression in parentheses.

### B.3.3 function hoisting

Sloppy-mode function hoisting is not allowed to pass through a do-expression.
