# ECMAScript proposal: `do` expressions

## Status

This proposal is in **stage 1** of [the TC39 process](https://tc39.github.io/process-document/).

## Motivation

* expression-oriented programming one of the great advances of FP
* expressions plug together like legos, making more malleable programming experience in-the-small

## Examples

Write in an expression-oriented style, scoping variables as locally as possible:

```js
let x = do {
  let tmp = f()
  tmp * tmp + 1
};
```

Use conditional statements as expressions, instead of awkward nested ternaries:

```js
let x = do {
  if (foo())
    a()
  else if (bar())
    b()
  else
    c()
};
```

Especially nice for templating languages like JSX:

```js
return (
  <nav>
    <Home />
    {
      do {
        if (!loggedIn) {
          <LoginButton />
        } else {
          if (membershipStatus === 'basic') {
            <UpgradeButton />
          } else if (membershipStatus === 'premium') {
            <PremiumBadge />
          } else {
            alertUserOfPaymentIssues()
            <CheckPaymentInfoButton />
          }
        }
      }
    }
  </nav>
)
```

## Tennant's Correspondence Principle

* key refactoring principles:
  * `do { <expr>; }` equivalent to `<expr>`
  * `(do { <stmt> };)` equivalent to `{ <stmt> }`
* this semantic transparency is demonstrated by the semantics:
  1. Return the result of evaluating _Body_.

## Further considerations

How to avoid either parsing conflict in statement context with `do`-`while`, or dangling-else type of ambiguity:

```js
do do f(); while (x)
```

I have several alternatives I intend to explore here.
