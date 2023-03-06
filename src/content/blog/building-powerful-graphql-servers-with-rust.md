---
title: "Building Powerful GraphQL Servers with Rust"
description: "Let us see what goes into building a GraphQL server with Rust."
pubDate: "Sep 13 2019"
slug: "building-powerful-graphql-servers-with-rust"
tags: ["rust", "graphql", "tutorial", "webdev"]
heroImage: https://images.unsplash.com/photo-1593062037896-764e9f52029e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80
---

Setting up a GraphQL server with Rust, Juniper, Diesel, and Actix; learning about Rust's web frameworks and powerful macros along the way.

Source Code: [github.com/iwilsonq/rust-graphql-example](https://github.com/iwilsonq/rust-graphql-example)

Serving applications via GraphQL is quickly becoming the easiest and most effective way to deliver data to clients. Whether you're on a mobile device or a browser, it provides the data requested and nothing more.

Client applications no longer need to stitch together information from separate data sources. GraphQL servers are in charge of the integration, eliminating the need for excess data and round-trip requests for data.

Of course, this implies that the server has to handle aggregating data from different sources, such as home-owned backend services, databases, or third party APIs. This may be resource intensive, how can we optimize for CPU time?

Rust is a marvel of a language, pairing the raw performance of a low level language like C with the expressiveness of modern languages. It emphasizes type and memory safety, especially when there are potentially data races in concurrent operations.

Let us see what goes into building a GraphQL server with Rust. We are going to learn about

- Juniper GraphQL Server
- Actix web framework integrated with Juniper
- Diesel for quering a SQL database
- Useful Rust macros and derived traits for working with these libraries

> Note that I will not go into detail regarding installing Rust or Cargo. This article assumes some preliminary knowledge of the Rust toolchain.

## Setting up an HTTP Server

To begin, we need to initialize our project with `cargo` and then install dependencies.

```sh
    cargo new rust-graphql-example
    cd rust-graphql-example
```

The initialization command bootstraps our Cargo.toml file which contains our projects dependencies as well as a [main.rs](http://main.rs) file which has a simple "Hello World" example.

```rust
    // main.rs

    fn main() {
      println!("Hello, world!");
    }
```

As a sanity check, feel free to run `cargo run` in order to execute the program.

Installing the necessary libraries in Rust means adding a line containing the library name and version number. Let's update the dependencies sections of Cargo.toml like so:

```rust

    # Cargo.toml

    [dependencies]
    actix-web = "1.0.0"
    diesel = { version = "1.0.0", features = ["postgres"] }
    dotenv = "0.9.0"
    env_logger = "0.6"
    futures = "0.1"
    juniper = "0.13.1"
    serde = "1.0"
    serde_derive = "1.0"
    serde_json = "1.0"
```

This article will cover implementing a GraphQL server using [Juniper](https://github.com/graphql-rust/juniper) as the GraphQL library and [Actix](https://actix.rs/) as the underlying HTTP server. Actix has a very nice API and works well with the stable version of Rust.

When those lines are added, the next time the project compiles it will include those libraries. Before we compile, lets update main.rs with a basic HTTP server, handling the index route.

```rust
    // main.rs
    use std::io;

    use actix_web::{web, App, HttpResponse, HttpServer, Responder};

    fn main() -> io::Result<()> {
        HttpServer::new(|| {
            App::new()
                .route("/", web::get().to(index))
        })
        .bind("localhost:8080")?
        .run()
    }

    fn index() -> impl Responder {
        HttpResponse::Ok().body("Hello world!")
    }
```

The first two lines at the top bring the module we need into scope. The main function here returns an `io::Result` type, which allows us to use the question mark as a shorthand for handling results.

The server's routing and configuration is created in the instance of `App`, which is created in a closure provided by the HTTP server's constructor.

The route itself is handled by the index function, whose name is arbitrary. As long as this function properly implements `Responder` it can be used as the parameter for the GET request at the index route.

If we were writing a REST API, we could proceed with adding more routes and associated handlers. We will see soon that we are trading a listing of route handlers for objects and their relations.

Now we will introduce the GraphQL library.

## Creating the GraphQL Schema

At the root of every GraphQL schema is a root query. From this root we can query lists of objects, specific objects, and whatever fields they might contain.

Call this the QueryRoot, and we shall denote it with the same name in our code. Since we are not going to be setting up a database or any third party APIs, we'll be hard-coding the little data we have here.

To add a little color to this example, the schema will depict a generic list of members.

Under src, add a new file called graphql_schema.rs along with the following contents:

```rust
    // graphql_schema.rs
    use juniper::{EmptyMutation, RootNode};

    struct Member {
      id: i32,
      name: String,
    }

    #[juniper::object(description = "A member of a team")]
    impl Member {
      pub fn id(&self) -> i32 {
        self.id
      }

      pub fn name(&self) -> &str {
        self.name.as_str()
      }
    }

    pub struct QueryRoot;

    #[juniper::object]
    impl QueryRoot {
      fn members() -> Vec<Member> {
        vec![
          Member {
            id: 1,
            name: "Link".to_owned(),
          },
          Member {
            id: 2,
            name: "Mario".to_owned(),
          }
        ]
      }
    }
```

Along with our imports, we define our first GraphQL object in this project, the member. They are simple beings, with an id and name. We'll think about more complicated fields and patterns later.

After stubbing out the `QueryRoot` type as a unit struct, we get to define the field itself. Juniper exposes a Rust macro called `object` which allows us to define fields on the different nodes throughout our schema. For now, we only have the QueryRoot node, so we'll expose a field called members on it.

Rust macros often have an unusual syntax compared to standard functions. They don't merely take some arguments and produce a result, they expand into much more complex code at compile time.

## Exposing the Schema

Below our macro call to create the members field, we will define the `RootNode` type that we expose on our schema.

```rust
    // graphql_schema.rs

    pub type Schema = RootNode<'static, QueryRoot, EmptyMutation<()>>;

    pub fn create_schema() -> Schema {
      Schema::new(QueryRoot {}, EmptyMutation::new())
    }
```

Because of the strong typing in Rust, we are forced to provide the mutation object argument. Juniper exposes an `EmptyMutation` struct for just this occasion, that is, when we want to create a read-only schema.

Now that the schema is prepared, we can update our server in main.rs to handle the "/graphql" route. Since having a playground is also nice, we'll add a route for GraphiQL, the interactive GraphQL playground.

```rust
    // main.rs
    #[macro_use]
    extern crate juniper;

    use std::io;
    use std::sync::Arc;

    use actix_web::{web, App, Error, HttpResponse, HttpServer};
    use futures::future::Future;
    use juniper::http::graphiql::graphiql_source;
    use juniper::http::GraphQLRequest;

    mod graphql_schema;

    use crate::graphql_schema::{create_schema, Schema};

    fn main() -> io::Result<()> {
        let schema = std::sync::Arc::new(create_schema());
        HttpServer::new(move || {
            App::new()
                .data(schema.clone())
                .service(web::resource("/graphql").route(web::post().to_async(graphql)))
                .service(web::resource("/graphiql").route(web::get().to(graphiql)))
        })
        .bind("localhost:8080")?
        .run()
    }
```

You'll notice I've specified a number of imports that we will be using, including the schema we've just created. Also see that:

- we call `create_schema` inside an Arc (atomically reference counted), to allow shared immutable state across threads (cooking with 🔥 here I know)
- we mark the closure inside HttpServer::new with **move**, indicating that the closure takes ownership of the inner variables, that is, it gains a copy of `schema`
- `schema` is passed to the `data` method indicating that it is to be used inside the application as shared state between the two services

We must now implement the handlers for those two services. Starting with the "/graphql" route:

```rust
    // main.rs

    // fn main() ...

    fn graphql(
        st: web::Data<Arc<Schema>>,
        data: web::Json<GraphQLRequest>,
    ) -> impl Future<Item = HttpResponse, Error = Error> {
        web::block(move || {
            let res = data.execute(&st, &());
            Ok::<_, serde_json::error::Error>(serde_json::to_string(&res)?)
        })
        .map_err(Error::from)
        .and_then(|user| {
            Ok(HttpResponse::Ok()
                .content_type("application/json")
                .body(user))
        })
    }
```

Our implementation of the "/graphql" route takes executes a GraphQL request against our schema from application state. It does this by creating a **future** from `web::block` and chaining handlers for success and error states.

Futures are analogous to Promises in JavaScript, which is enough to understand this code snippet. For a greater explanation of Futures in Rust, I recommend [this article by Joe Jackson](https://www.viget.com/articles/understanding-futures-in-rust-part-1/).

In order to test out our GraphQL schema, we'll also add a handler for "/graphiql".

```rust
    // main.rs

    // fn graphql() ...

    fn graphiql() -> HttpResponse {
        let html = graphiql_source("http://localhost:8080/graphql");
        HttpResponse::Ok()
            .content_type("text/html; charset=utf-8")
            .body(html)
    }
```

This handler is much simpler, it merely returns the html of the GraphiQL interactive playground. We only need to specify which path is serving our GraphQL schema, which is "/graphql" in this case.

With `cargo run` and navigation to [http://localhost:8080/graphiql](http://localhost:8080/graphiql), we can try out the field we configured.

![Members query in graphiql](https://thepracticaldev.s3.amazonaws.com/i/t22qyi7xarthf9xm2yvl.png)

It does seem to take a little more effort than setting up a GraphQL server with [Node.js and Apollo](https://www.freecodecamp.org/news/learn-to-build-a-graphql-server-with-minimal-effort-fc7fcabe8ebd/) but the static typing of Rust combined with its incredible performance makes it a worthy trade — if you're willing to work at it.

## Setting up Postgres for Real Data

If I stopped here, I wouldn't even be doing [the examples in the docs](https://graphql-rust.github.io/juniper/master/index.html) much justice. A static list of two members _that I wrote myself_ at dev time will not fly in this publication.

Installing Postgres and setting up your own database belongs in a different article, but I'll walk through how to install [diesel](http://diesel.rs), the popular Rust library for handling SQL databases.

> [See here to install Postgres locally on your machine](https://www.postgresql.org/download/). You can also use a different database like MySQL in case you are more familiar with it.

The diesel CLI will walk us through initializing our tables. Let's install it:

```sh
    cargo install diesel_cli --no-default-features --features postgres
```

After that, we will add a connection URL to a .env file in our working directory:

```sh
    echo DATABASE_URL=postgres://localhost/rust_graphql_example > .env
```

Once that's there, you can run:

```sh
    diesel setup

    # followed by

    diesel migration generate create_members
```

Now you'll have a migrations folder in your directory. Within it, you'll have two SQL files: one up.sql for setting up your database, the other down.sql for tearing it down.

I will add the following to up.sql:

```sql
    CREATE TABLE teams (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL
    );

    CREATE TABLE members (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      knockouts INT NOT NULL DEFAULT 0,
      team_id INT NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    INSERT INTO teams(id, name) VALUES (1, 'Heroes');
    INSERT INTO members(name, knockouts, team_id) VALUES ('Link', 14, 1);
    INSERT INTO members(name, knockouts, team_id) VALUES ('Mario', 11, 1);
    INSERT INTO members(name, knockouts, team_id) VALUES ('Kirby', 8, 1);

    INSERT INTO teams(id, name) VALUES (2, 'Villains');
    INSERT INTO members(name, knockouts, team_id) VALUES ('Ganondorf', 8, 2);
    INSERT INTO members(name, knockouts, team_id) VALUES ('Bowser', 11, 2);
    INSERT INTO members(name, knockouts, team_id) VALUES ('Mewtwo', 12, 2);
```

And into down.sql I will add:

```sql
    DROP TABLE members;
    DROP TABLE teams;
```

If you've written SQL in the past, these statements will make some sense. We are creating two tables, one to store teams and one to store members of those teams.

I am modeling this data based on Smash Bros if you have not yet noticed. It helps the learning stick.

Now to run the migrations:

```sh
    diesel migration run
```

If you'd like to verify that the down.sql script works to destroy those tables, run: `diesel migration redo`.

Now the reason why I named the GraphQL schema file graphql_schema.rs instead of schema.rs, is because diesel overwrites that file in our src direction by default.

It keeps a Rust macro representation of our SQL tables in that file. It is not so important to know how exactly this `table!` macro works, but try not to edit this file — the ordering of the fields matters!

```rust
    // schema.rs (Generated by diesel cli)

    table! {
        members (id) {
            id -> Int4,
            name -> Varchar,
            knockouts -> Int4,
            team_id -> Int4,
        }
    }

    table! {
        teams (id) {
            id -> Int4,
            name -> Varchar,
        }
    }

    joinable!(members -> teams (team_id));

    allow_tables_to_appear_in_same_query!(
        members,
        teams,
    );
```

Finally, thanks to a comment, we'll want to import diesel and expose the schema module in main.rs:

```diff

    #[macro_use]
+   extern crate diesel;
    extern crate juniper;

    use std::io;
    use std::sync::Arc;

    use actix_web::{web, App, Error, HttpResponse, HttpServer};
    use futures::future::Future;
    use juniper::http::graphiql::graphiql_source;
    use juniper::http::GraphQLRequest;

    mod graphql_schema;
+   mod schema;

    use crate::graphql_schema::{create_schema, Schema};


```

## Wiring up our Handlers with Diesel

In order to serve the data in our tables, we must first update our `Member` struct with the new fields:

```diff
// graphql_schema.rs

+ #[derive(Queryable)]
pub struct Member {
  pub id: i32,
  pub name: String,
+ pub knockouts: i32,
+ pub team_id: i32,
}

#[juniper::object(description = "A member of a team")]
impl Member {
  pub fn id(&self) -> i32 {
    self.id
  }

  pub fn name(&self) -> &str {
    self.name.as_str()
  }

+ pub fn knockouts(&self) -> i32 {
+   self.knockouts
+ }

+ pub fn team_id(&self) -> i32 {
+   self.team_id
+ }
}
```

Note that we are also adding the `Queryable` derived attribute to `Member`. This tells Diesel everything it needs to know in order to query the right table in Postgres.

Additionally, add a `Team` struct:

```rust
    // graphql_schema.rs

    #[derive(Queryable)]
    pub struct Team {
      pub id: i32,
      pub name: String,
    }

    #[juniper::object(description = "A team of members")]
    impl Team {
      pub fn id(&self) -> i32 {
        self.id
      }

      pub fn name(&self) -> &str {
        self.name.as_str()
      }

      pub fn members(&self) -> Vec<Member> {
        vec![]
      }
    }
```

In a short while, we will update the `members` function on `Team` to return a database query. But first, let us add a root call for members.

```diff
    // graphql_schema.rs
    + extern crate dotenv;

    + use std::env;

    + use diesel::pg::PgConnection;
    + use diesel::prelude::*;
    + use dotenv::dotenv;
    use juniper::{EmptyMutation, RootNode};

    + use crate::schema::members;

    pub struct QueryRoot;

    +  fn establish_connection() -> PgConnection {
    +    dotenv().ok();
    +    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    +    PgConnection::establish(&database_url).expect(&format!("Error connecting to {}", database_url))
    +  }

    #[juniper::object]
    impl QueryRoot {
      fn members() -> Vec<Member> {
    -   vec![
    -     Member {
    -       id: 1,
    -       name: "Link".to_owned(),
    -     },
    -     Member {
    -       id: 2,
    -       name: "Mario".to_owned(),
    -     }
    -   ]
    +   use crate::schema::members::dsl::*;
    +   let connection = establish_connection();
    +   members
    +     .limit(100)
    +     .load::<Member>(&connection)
    +     .expect("Error loading members")
      }
    }
```

Very good, we have our first usage of a diesel query. After initializing a connection, we use the members dsl, which is generated from our `table!` macros in schema.rs, and call **load**, indicating that we wish to load `Member` objects.

Establishing a connection means connecting to our local Postgres database by using the env variable we declared earlier.

Assuming that was all input correctly, restart the server with `cargo run`, open GraphiQL and issue the members query, perhaps adding the two new fields.

The teams query will be very similar — the difference being we must also add a part of the query to the members function on the `Team` struct in order to resolve the relationship between GraphQL types.

```rust
    // graphql_schema.rs

    #[juniper::object]
    impl QueryRoot {
      fn members() -> Vec<Member> {
        use crate::schema::members::dsl::*;
        let connection = establish_connection();
        members
          .limit(100)
          .load::<Member>(&connection)
          .expect("Error loading members")
      }

    +  fn teams() -> Vec<Team> {
    +    use crate::schema::teams::dsl::*;
    +    let connection = establish_connection();
    +    teams
    +      .limit(10)
    +      .load::<Team>(&connection)
    +      .expect("Error loading teams")
    +  }
    }

    // ...

    #[juniper::object(description = "A team of members")]
    impl Team {
      pub fn id(&self) -> i32 {
        self.id
      }

      pub fn name(&self) -> &str {
        self.name.as_str()
      }

      pub fn members(&self) -> Vec<Member> {
    -    vec![]
    +    use crate::schema::members::dsl::*;
    +    let connection = establish_connection();
    +    members
    +      .filter(team_id.eq(self.id))
    +      .limit(100)
    +      .load::<Member>(&connection)
    +      .expect("Error loading members")
      }
    }
```

When running this is GraphiQL, we get:

![More complex query in graphiql](https://thepracticaldev.s3.amazonaws.com/i/1gsj02nf5m8le9ujjbr8.png)

I really like the way this is turning out, but there is one more thing we must add in order to call this tutorial complete.

## The Create Member Mutation

What good is a server if it is read-only and not writable? Well I'm sure those have their uses too, but we would like to write data to our database, how hard can it be?

First we'll create a `MutationRoot` struct that will eventually replace our usage of `EmptyMutation`. Then we will add the diesel insertion query.

```rust
    // graphql_schema.rs

    // ...

    pub struct MutationRoot;

    #[juniper::object]
    impl MutationRoot {
      fn create_member(data: NewMember) -> Member {
        let connection = establish_connection();
        diesel::insert_into(members::table)
          .values(&data)
          .get_result(&connection)
          .expect("Error saving new post")
      }
    }

    #[derive(juniper::GraphQLInputObject, Insertable)]
    #[table_name = "members"]
    pub struct NewMember {
      pub name: String,
      pub knockouts: i32,
      pub team_id: i32,
    }
```

As GraphQL mutations typically go, we define an input object called `NewMember` and make it the argument of the `create_member` function. Inside this function, we establish a connection and call the insert query on the members table, passing the entire input object.

It is super convenient that Rust allows us to use the same structs for GraphQL input objects as well as Diesel insertable objects.

Let me make this a little more clear, for the `NewMember` struct:

- we derive `juniper::GraphQLInputObject` in order to create a input object for our GraphQL schema
- we derive `Insertable` in order to let Diesel know that this struct is valid input for an insertion SQL statement
- we add the `table_name` attribute so that Diesel knows which table to insert it in

There is a lot of _magic_ going on here. This is what I love about Rust, it has great performance but the code has features like macros and derived traits to abstract away boilerplate and add functionality.

Finally, at the bottom of the file, add the `MutationRoot` to the schema:

```rust
    // graphql_schema.rs

    pub type Schema = RootNode<'static, QueryRoot, MutationRoot>;

    pub fn create_schema() -> Schema {
      Schema::new(QueryRoot {}, MutationRoot {})
    }
```

I hope that everything is there, we can test out all of our queries and mutations thus far now:

```graphql
# GraphiQL

mutation CreateMemberMutation($data: NewMember!) {
  createMember(data: $data) {
    id
    name
    knockouts
    teamId
  }
}

# example query variables
# {
#   "data": {
#     "name": "Samus",
#     "knockouts": 19,
#     "teamId": 1
#   }
# }
```

If that mutation ran successfully, you can pop open a bottle of champagne as you are on your way to building performant and type-safe GraphQL Servers with Rust.

## Thanks For Reading

I hope you have enjoyed this article, I also hope that it gave you some sort of inspiration for your own work.

If you'd like to keep up with the next time I drop an article in the realm of Rust, ReasonML, GraphQL, or software development at large, feel free to give me a follow on [Twitter](https://twitter.com/iwilson), [dev.to](https://dev.to/iwilsonq), or on my website at [ianwilson.io](https://ianwilson.io).

The source code is here [github.com/iwilsonq/rust-graphql-example](https://github.com/iwilsonq/rust-graphql-example).

### Other Neat Reading Material

Here are some of the libraries we worked with here. They have great documentation and guides as well so be sure to give them a read :)

- [Implementation of Rust Futures in Tokio](https://tokio.rs/docs/getting-started/futures/)
- [Juniper - GraphQL Server for Rust](https://graphql-rust.github.io/juniper/master/index.html)
- [Diesel - Safe, Extensible ORM and Query Builder for Rust](http://diesel.rs/)
- [Actix - Rust's powerful actor system and most fun web framework](https://actix.rs/)
