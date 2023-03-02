---
title: 'Mastering the File System with Rust'
pubDate: 'Mar 24 2020'
slug: rust-fs
description: Reading and writing files and directories with Rust
tags: rust, webdev
---

![file cabinet](https://images.unsplash.com/photo-1569235186275-626cb53b83ce?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1952&q=80)

_Photo by [Maksym Kaharlytskyi](https://unsplash.com/@qwitka) on Unsplash_

Building backend services with Rust can be difficult if you have to keep 10 tabs worth of documentation open at all times. I find it helpful to practice and learn how certain libraries work, reducing the time spent combing through documentation.

Depending on the kind of application or utility you are making, you may need to deal with the filesystem at some point.

If you're creating some sort of data storage without reaching for a database like Postgres or MySQL, you'll probably store your data in files.

If you're writing software to compose audio or video, you'd have to be able to write and read those files.

If you're creating a utility to help scaffold out a project like `create-react-app` or `cargo new`, you would want to use the filesystem to create your boilerplate directories and files.

Regardless of your goals, it would be helpful to know the common methods used in the `std::fs` namespace as you'll otherwise be looking them up all the time while building your project.

# Overview of Key Functions

> **Docs:** The docs for the `fs` crate are available [here](https://doc.rust-lang.org/std/fs/index.html).

## Reading files

> **Note:** If you do not yet understand how generic function parameters work, you can read [this chapter in the Rust Book](https://doc.rust-lang.org/book/ch10-01-syntax.html?highlight=generic#generic-data-types).

> For example, a path, P, is defined to be any type which implements a method which implements the trait `AsRef<Path>`.

Starting with the basics, this is the function signature for `std::fs::read`.

```rust
fn read<P: AsRef<Path>>(path: P) -> io::Result<Vec<u8>>
```

You can use this method of the `fs` crate in order to read a file at a given **path** and return a **vector of bytes**. Its usage works like the below snippet:

```rust
use std::fs;
use std::path::Path;

fn main() {
  let path = Path::new("screenshot.png");
  let data = fs::read(path).unwrap();

  // do something with `data`
}

```

The read method is actually a convenience wrapper for calls to `File::open` and `std::fs::read_to_end`. This is nice because we have access to the granular, low-level functions without sacrificing the simpler `read` method.

```rust
pub fn read<P: AsRef<Path>>(path: P) -> io::Result<Vec<u8>> {
    fn inner(path: &Path) -> io::Result<Vec<u8>> {
        let mut file = File::open(path)?;
        let mut bytes = Vec::with_capacity(initial_buffer_size(&file));
        file.read_to_end(&mut bytes)?;
        Ok(bytes)
    }
    inner(path.as_ref())
}
```

## Writing files

Here is the function signature for `fs::write`:

```rust
fn write<P: AsRef<Path>, C: AsRef<[u8]>>(path: P, contents: C) -> Result<()>
```

Assuming you have some data as a **slice of bytes**, you can write this to a file at a **path**.

Since the write method is merely a side-effect, it's return is just a `Result` type which resolves to either unit or an error if something went wrong.

```rust
use std::fs;
use std::path::Path;

fn main() {
  let path = Path::new("hello.txt");
  let contents = "hello there";
  fs::write(path, contents).unwrap();
}

```

Just like with the read method, write is a convenience wrapper for `File::create` and `std::io::write_all`. Here is the actual implementation:

```rust
pub fn write<P: AsRef<Path>, C: AsRef<[u8]>>(path: P, contents: C)
  -> io::Result<()> {
    fn inner(path: &Path, contents: &[u8]) -> io::Result<()> {
        File::create(path)?.write_all(contents)
    }
    inner(path.as_ref(), contents.as_ref())
}
```

With both `fs::read` and `fs::write`, we see generic type arguments in action. For the P argument, this allows us to use types like `str`, `String`, `Path`, or `PathBuf` when calling one of these methods.

The standard library uses a pattern where they define an `inner` function with specific type parameters. They then call it with the outermost arguments after casting them with `as_ref`, the function required by the `AsRef` trait.

My goal is not to explain generic types and traits, but I find exploring how the standard library uses them to be quite insightful.

## An Example: Copying files

Let us say we'd like to copy a file from one directory to another, similar to the `cp` command on unix.

We could do this by writing:

```rust
use std::fs;
use std::path::Path;

fn main() {
  let input = Path::new("hello.txt");
  let data = fs::read(input).unwrap();

  let output = Path::new("hello_copy.txt");
  fs::write(output, data).unwrap();
}
```

Rust's `fs` library gives us yet another convenience method for this task, `fs::copy`.

```rust
use std::fs;
use std::path::Path;

fn main() {
  let input = Path::new("hello.txt");
  let output = Path::new("hello_copy.txt");
  fs::copy(input, output).unwrap();
}
```

## Other Useful Methods

Read and write are definitely some of the more obvious uses of a filesystem, but generally speaking, a thorough application will also include other capabilities like handling directories.

**Reading utilities:**

- `fs::read_to_string` - returns file contents as a `String` rather than `[u8]` bytes
- `fs::read_dir` - returns an iterator over all of the entries (files and other directories) within a directory

**Writing utilities:**

- `fs::create_dir` - creates a new, empty directory at a given path.
- `fs::create_dir_all` - given a path, will recursively create all necessary directories if they are missing
- `fs::rename` - rename a file or directory to a given name, similar to `mv` command in unix

**Removal utilities:**

- `fs::remove_file` - remove a given file
- `fs::remove_dir` - remove a given, **empty** directory
- `fs::remove_dir_all` - remove a directory and all of its contents (be careful with this one)

Since this isn't a match statement, I won't present an exhaustive list of methods, but you can view that [in the docs](https://doc.rust-lang.org/std/fs/index.html).

## Thanks For Reading

I hope you have enjoyed this article or found some sort of use for it. I am currently working on a project that uses some of these method to create something that will help my own development.

If you'd like to keep up with the next time I drop an article in the realm of Rust, ReasonML, GraphQL, or software development at large, feel free to give me a follow on [Twitter](https://twitter.com/iwilson), [dev.to](https://dev.to/iwilsonq), or on my website at [ianwilson.io](https://ianwilson.io).
