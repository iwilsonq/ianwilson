---
title: ReasonML with GraphQL, the Future of Type-Safe Web Applications
description: Build a small ReasonReact web application that consumes a GraphQL endpoint using reason-apollo
tags: ['reason', 'graphql', 'javascript', 'fp']
pubDate: 'Mar 13 2019'
slug: reasonml-with-graphql
heroImage: https://thepracticaldev.s3.amazonaws.com/i/aejew3ps1khqnw7gy0yk.png
---

![](https://thepracticaldev.s3.amazonaws.com/i/aejew3ps1khqnw7gy0yk.png)

_I made this graphic myself_

ReasonML, also known as JavaScript-flavored OCaml, offers nearly impenetrable type safety for developing user interfaces. By adopting a static type system, you can eliminate an entire class of errors before your app is served.

We’re going to look into building a small web application that uses consumes a GraphQL endpoint using ReasonML. We’ll cover:

- getting started with a ReasonReact project
- setting up a client with reason-apollo
- sending queries
- mutating data

If you’re new to both GraphQL and ReasonML, I’d suggest learning one at a time. Learning more than one big thing at once is often difficult for me. If you’re experienced with JavaScript and GraphQL, but want to learn ReasonML, read on, but keep the [docs](https://reasonml.github.io) handy.

## Getting Started - Establishing a ReasonReact Project

In order to get going with ReasonML, we must first install the cli, `bsb-platform` that handles bootstrapping the project. You should also get an editor plugin that helps with developing ReasonML apps. If you’re using VSCode, reason-vscode by Jared Forsyth is my preferred plugin.

```bash
npm install -g bsb-platform
```

This installs the BuckleScript compiler that turns our ReasonML into wonderful JavaScript which has already been type-checked and can be run in the browser.

Now we can initialize our project and hop right in.

```bash
bsb -init reason-graphql-example -theme react
cd reason-graphql-example
npm install
```

- The `init` argument specifies the name of the project we’re initializing.
- The `theme` argument specifies the template we wish to use. I usually just choose the react theme.
- We run `npm install` to install dependences just like in any other JavaScript project.

With the project scaffolded, we can try to build it. In two separate terminal panes, run:

```bash
npm start
# and
npm run webpack
```

- `npm start` tells BuckleScript (bsb) to build the project watch for changes to your .re files.
- `npm run webpack` fires up webpack to build your main JavaScript bundle

_Quick tip: you’ll notice that the webpack output is in the **build** folder but the index.html file is in the **src** folder. We can make serving the project a little bit easier by moving the index.html file to the build folder and rewriting the script tag to point at the adjacent Index.js file. _

With all that taken care of, you can serve your build folder using `http-server build` or `serve build` and check out the project.

![initial screen](https://thepracticaldev.s3.amazonaws.com/i/sfcjd5lxm76wsycbrcny.png)

When I’m developing a ReasonML project, I’m running 3 terminal tabs:

1. `npm start` to transpile ReasonML to JavaScript
2. `npm run webpack` to bundle JavaScript
3. `serve build` to actually serve the build on a port

Before we can get to the fun stuff, we still must clear out the boilerplate and set up react-apollo.

Go ahead and remove the Component1 and Component2 files, and then update Index.re to the following:

```ocaml
ReactDOMRe.renderToElementWithId(<App />, "root");
```

Update index.html to:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>ReasonML GraphQL Example</title>
  </head>
  <body>
    <div id="root"></div>

    <script src="./Index.js"></script>
  </body>
</html>
```

Finally, create an App.re file and add the following:

```ocaml
/* App.re */
let str = ReasonReact.string;
let component = ReasonReact.statelessComponent("App");

let make = _children => {
  ...component,
  render: _self =>
	<div>
	  <h1> {"Hello ReasonReact" |> str} </h1>
	</div>
};
```

You might have to re-run your terminal commands, but with all that said and done, you should have something like this appear on your screen:

![hello reason react](https://thepracticaldev.s3.amazonaws.com/i/7732nf5s6g7o93r406rp.png)

It feels like a lot of effort to get started, but accepting early friction for a smoother experience later on is the tradeoff here.

## Initializing Reason Apollo

In order to get set up with Apollo we’re going to run:

```bash
npm install -S reason-apollo react-apollo apollo-client apollo-cache-inmemory apollo-link apollo-link-context apollo-link-error apollo-link-http graphql graphql-tag apollo-link-ws apollo-upload-client subscriptions-transport-ws
```

That looks like a big install command. It is, but only the first package, reason-apollo, is consumed in our ReasonML code. However, reason-apollo is a library of binding labels depends on these other JavaScript packages.

In order to make writing GraphQL queries more friendly we’ll need one more dev dependency.

```bash
npm install -D graphql_ppx
```

As that installs we can open up our bsconfig.json file and update the “bs-dependencies” and “ppx-flags” keys like so:

```json
// bsconfig.json
{
  "bs-dependencies": ["reason-react", "reason-apollo"],
  "ppx-flags": ["graphql_ppx/ppx"]

  // other fields...
}
```

The “bs-dependencies” array tells BuckleScript to include those npm modules in the build process. The ppx flags array lets our IDE know how to handle preprocess certain directives, GraphQL in our case.

Create a file inside the src folder called Client.re. This is where we will declare our instance of the Apollo Client.

```ocaml
/* Client.re */
let inMemoryCache = ApolloInMemoryCache.createInMemoryCache();

let httpLink =
  ApolloLinks.createHttpLink(~uri="https://video-game-api-pvibqsoxza.now.sh/graphql", ());

let instance =
  ReasonApollo.createApolloClient(~link=httpLink, ~cache=inMemoryCache, ());
```

> Note: If this uri, https://video-game-api-pvibqsoxza.now.sh/graphql does not work, please send me a message on twitter or here in the comments and I’ll update that as quickly as possible

When we work with ReasonML, any variable that we create with a `let` binding is automatically exported from the module for us.

With the instance created, we can reference it in any of our other .re files. Update Index.re to the following:

```ocaml
/* Index.re */
ReactDOMRe.renderToElementWithId(
  <ReasonApollo.Provider client=Client.instance>
    <App />
  </ReasonApollo.Provider>,
  "root",
);
```

It looks a little like a standard React JS application, with a couple caveats. Notice that there are no import statements. In ReasonML, we have access to all of the namespaces built in our application. From the perspective of Index.re, We can see the `Client` and the `App` modules.

When we create a .re file in our src folder, it becomes a module. We could also declare our modules explicitly within our files.

It is now time to consume our API.

## Sending Queries and Rendering a List

While writing this article I created a small Node GraphQL server, the code of which is available at [this repo](https://github.com/iwilsonq/video-game-api). To keep costs low, I declared an array of mock data to return on each GraphQL request rather than host a database.

Rather than create a todo app, I decided to create a list of video games that I played at some point long ago. Then, I could check if I finished it or not, thus remembering the games that I still haven’t beat.

As we are working with a GraphQL server, we should be able to figure out exactly how to call it by observing the schema.

```graphql
type VideoGame {
  id: ID!
  title: String!
  developer: String!
  completed: Boolean!
}

type Query {
  videoGames: [VideoGame!]!
}

type Mutation {
  completeGame(id: ID!): VideoGame!
}
```

Currently, we have one query and one mutation, both of which operate around this `VideoGame` type. A GraphQL adept will notice that every return value is non-nullable, that is, these responses cannot return unset fields or null objects.

Soon we’ll see why all of the !’s are particularly important for our ReasonML code.

Let’s begin by defining the query in on top of App.re, just below the `component` declaration.

```ocaml
/* App.re */

module VideoGames = [%graphql
  {|
  query VideoGames {
    videoGames {
      id
      title
      developer
      completed
    }
  }
|}
];

module VideoGamesQuery = ReasonApollo.CreateQuery(VideoGames);

/* let make = ... */
```

Comparing with the JavaScript in react-apollo, this code would be most analogous to:

```js
const VideoGames = gql`
  query VideoGames {
    videoGames {
      id
      title
      developer
      completed
    }
  }
`

// later in render
render() {
  return (
    <Query query={VideoGames}> {/* ... */} </Query>
  )
}

```

Now let’s update the render function:

```ocaml
/* App.re */
let make = _children => {
  ...component,
  render: _self => {
	let videoGamesQuery = VideoGames.make();
	<div>
		<h1> {"ReasonML + ReasonReact + GraphQL" |> str} </h1>
		<VideoGamesQuery variables=videoGamesQuery##variables>
        ...{
             ({result}) =>
               switch (result) {
               | Loading => <div> {"Loading video games!" |> str} </div>
               | Error(error) => <div> {error##message |> str} </div>
               | Data(data) => <VideoGameList items=data##videoGames />
               }
           }
      </VideoGamesQuery>
	</div>;
  }
};
```

Here, we’re taking advantage of ReasonML’s coolest feature - [pattern matching](https://reasonml.github.io/docs/en/pattern-matching). Pattern matching combined with [variants](https://reasonml.github.io/docs/en/variant) makes the logic that you would otherwise put in branches of if-else statements more linear and easier to follow. It is also reduces branch checking to [constant rather than linear time](https://reasonml.github.io/docs/en/variant), making it more efficient.

If the ReasonML code ever seems more verbose, just remember we’re still getting perfect type safety when it compiles. We still need to build the `VideoGamesList` component as well as define the `videoGame` record type.

Starting with the record type, create a new file called VideoGame.re and add the following:

```ocaml
/* VideoGame.re */

[@bs.deriving jsConverter]
type videoGame = {
  id: string,
  title: string,
  developer: string,
  completed: bool,
};
```

The `videoGame` type as we have it here, has 4 fields, none of which are optional. The BuckleScript directive above it adds a pair of exported utility methods that allow us to [convert between ReasonML records and JavaScript objects](https://bucklescript.github.io/docs/en/generate-converters-accessors).

> Tip: when Apollo returns a response, it returns untyped JavaScript objects. The `jsConverter` directive gives us an exported method called `videoGameFromJs` that we can use to map the Apollo query data to fully typed ReasonML.

To see this mechanic in action, create a new file called VideoGameList.re and add:

```ocaml
/* VideoGameList.re */
open VideoGame;

let str = ReasonReact.string;
let component = ReasonReact.statelessComponent("VideoGameList");

let make = (~items, _children) => {
  ...component,
  render: _self =>
    <ul style={ReactDOMRe.Style.make(~listStyleType="none", ())}>
      {
        items
        |> Array.map(videoGameFromJs)
        |> Array.map(item =>
             <li key={item.id}>
             	<input
                  id={item.id}
                  type_="checkbox"
                  checked={item.completed}
                />
                <label htmlFor={item.id}>
                  {item.title ++ " | " ++ item.developer |> str}
                </label>
             </li>
           )
        |> ReasonReact.array
      }
    </ul>,
};
```

1. Open the `VideoGame` module (VideoGame.re) at the top so we can use all of it’s exports in the `VideoGameList` module.
2. Declare the component type and string rendering shorthand.
3. Define a make function that expects one prop, `items`.
4. Inside the render function, pipe the items to convert JS objects to ReasonML records, map records to JSX, and finally output them as an array.

> Note: Piping basically reverses the order of function calls to potentially improve readability. With the `|>` operator, the `items` object is applied to each function as the _last_ argument.

Though I like prefer the piping style, the following are equivalent.

```ocaml
items
	|> Array.map(videoGameFromJs)
	|> Array.map(renderItem)
	|> ReasonReact.array;

ReasonReact.array(
	Array.map(
		renderItem,
		Array.map(
			videoGameFromJs,
			items
		)
	)
);
```

I think we are ready to once again compile and serve our project. If you haven’t already, run this command in your project root:

```bash
yarn send-introspection-query https://video-game-api-pvibqsoxza.now.sh/graphql
```

This generates a `graphql_schema.json` file that Reason Apollo uses to type check your queries. If your ReasonML app asks for a field that isn’t on the schema, or if it doesn’t properly handle optional data types, it will not compile.

The strict typing serves as a wonderful sanity check for writing queries and mutations.

When all is said and done, you should see the following.

![finished screen](https://thepracticaldev.s3.amazonaws.com/i/96prj40pfw9frc23j68r.png)

Don’t yell at me for not finishing the main story in Skyrim.

## Mutating Data

One thing you may notice thus far is that clicking the checkboxes doesn’t do anything. This is expected, since we have not yet wired up a mutation.

Let us begin by recalling our schema above, and creating a module for the mutation to mark a game completed.

Inside VideoGameList.re, add these modules to the top of the file just beneath the call to create a component.

```ocaml
/* VideoGameList.re */
module CompleteGame = [%graphql
  {|
  mutation CompleteGame($id: ID!) {
    completeGame(id: $id) {
      id
      completed
    }
  }
|}
];

module CompleteGameMutation = ReasonApollo.CreateMutation(CompleteGame);
```

For the render prop of the mutation, it’ll look pretty similar to the JavaScript version. I’ll put this code here and then walk through it, starting from inside the `<li>` tag.

```ocaml
/* VideoGameList.re */

<li key={item.id}>
  <CompleteGameMutation>
    ...{
        (mutate, {result}) => {
          let loading = result == Loading;
          <div>
            <input
              id={item.id}
              type_="checkbox"
              checked={item.completed}
              onChange={
                _event => {
                  let completeGame =
                    CompleteGame.make(~id=item.id, ());
                  mutate(~variables=completeGame##variables, ())
                  |> ignore;
                }
              }
            />
            <label
              htmlFor={item.id}
              style={
                ReactDOMRe.Style.make(
                  ~color=loading ? "orange" : "default",
                  (),
                )
              }>
              {item.title ++ " | " ++ item.developer |> str}
            </label>
          </div>;
        }
      }
  </CompleteGameMutation>
</li>
```

Like the Apollo `VideoGamesQuery` component we used earlier, the `CompleteGameMutation` component we see here passes to its children a mutate function as well as a results object.

This particular component is not the best example to show off how you could use that results object, as I only take advantage of it when a single item is being updated. If it is, I color the text of the item label green and call that the loading state.

I’m no UX guy, but I think that’ll do for today.

## Wrapping Up

ReasonML is a pretty powerful and expressive language. If you are new to ReasonML and itching to build some type safe user interfaces, here are some resources to learn from:

1. Many of the third party tools we use in JavaScript come out of the box with ReasonML. This [article by David Kopal explains how](https://medium.freecodecamp.org/psst-heres-why-reasonreact-is-the-best-way-to-write-react-5088d434d035?source=linkShare-2467058898a1-1543182271), along with some other reasons why writing ReasonML is so cool.
2. [Jared Forsyth’s blog](https://jaredforsyth.com) has great content about ReasonML and OCaml. He is one of the most active contributors to the community.
3. I get most of my learning done through the [ReasonML docs](reasonml.github.io) and the [BuckleScript docs](bucklescript.github.io). They are easy to follow and contain powerful insights on the design choices when implementing language features.

If you want to quickly set up your own GraphQL server then check out my other article, [Learn to Build a GraphQL Server with Minimal Effort](https://medium.freecodecamp.org/learn-to-build-a-graphql-server-with-minimal-effort-fc7fcabe8ebd).

I hope to write more articles about ReasonML and GraphQL in the future. If these interest you then by all means follow me on [Medium](https://medium.com/@iwilsonq) and on [Twitter](https://twitter.com/iwilsonq)!

This article was originally published in _[Open GraphQL on Medium](https://medium.com/open-graphql/reasonml-with-graphql-the-future-of-type-safe-web-applications-65be2e8f34c8)_.
