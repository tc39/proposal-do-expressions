# ECMAScript proposal: `do` expressions

NOTE: This is a fork of the [original proposal](https://github.com/tc39/proposal-do-expressions/). If this advances to stage 2, it will be upstreamed into that repository.

This proposal has [preliminary spec text](https://bakkot.github.io/do-expressions-v2/).

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

Because of the potential for confusion, you can't end a do-expression with a declaration or a loop (even when nested in other statements). For example, the following are all Early Errors:

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

More formally, the completion value of the _StatementList_ can't rely on the completion value of a loop or declaration. See EndsInIterationOrDeclaration in the proposed specification for details.

The restriction on declarations is particularly unfortunate. It arises from the fact that declarations have `~empty~` as their completion value, meaning `do { 'before'; let x = 'after'; }` would evaluate to `before`. I'd like to pursue changing the completion value for declarations in general, which would affect existing code relying on `eval`.

## Edge cases

### `var` declarations

`var` declarations are allowed (except as the final statement), with the binding hoisting to the containing function's scope. Exception: `var` declarations are an Early Error when the `do` occurs in a parameter expression.

### Empty `do`

`do {}` is allowed and is equivalent to `void 0`.

### `await`/`yield`

The ability to use `await` and `yield` is inherited from the context of the enclosing function, as it is in any other expression.

#### But doesn't `yield` let you `return`?

Technically, yes, with coordination from outside of the called function. But this is a fairly obscure corner of the language; I am very hesitant to reason from its example.

### `throw`

Works fine. Does what you expect.

### `break`/`continue`/`return`

These are not allowed to cross the boundary of the `do`. (It's an Early Error if you try.)

#### Duplicate labels

```js
label: {
  (do {
    label: ;
  });
}
```
would be disallowed. This is in contrast to

```js
label: {
  function inner(){
    label: ;
  }
}
```
which is legal. This is prohibited because it's confusing, and as a bonus it would leave room for relaxing the restriction on `break`/`continue` in the future.

### Conflict with `do-while`

`do` expressions are prohibited in contexts in which statements are legal. In such contexts you can just use a normal block or enclose the `do` expression in parentheses.

### B.3.3 function hoisting

Sloppy-mode function hoisting is not allowed to pass through a do-expression.
