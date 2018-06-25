<p align="center"><img width="256" src="https://raw.githubusercontent.com/eunjae-lee/apitool/master/logo.png"></p>

[![Build Status](https://travis-ci.org/eunjae-lee/apitool.svg?branch=master)](https://travis-ci.org/eunjae-lee/apitool)
[![npm version](http://img.shields.io/npm/v/apitool.svg)](https://npmjs.org/package/apitool)
[![GitHub stars](https://img.shields.io/github/stars/eunjae-lee/apitool.svg)](https://github.com/eunjae-lee/apitool/stargazers)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/eunjae-lee/apitool.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Feunjae-lee%2Fapitool)


# Introduction

`apitool` is a wrapper of `axios`. It provides an organized way to work with APIs.

This goes smoothly with your TypeScript-based project since it's written in TypeScript.

# Table of contents

<!-- toc -->

- [Install](#install)
- [Getting Started](#getting-started)
  * [Performing a simple `GET` request](#performing-a-simple-get-request)
  * [Performing a simple `POST` request](#performing-a-simple-post-request)
  * [`result` Schema](#result-schema)
- [Getting deeper](#getting-deeper)
  * [`ErrorType` Schema](#errortype-schema)
  * [Combining configs](#combining-configs)
  * [Importing things](#importing-things)
  * [Contributing](#contributing)
  * [Author](#author)

<!-- tocstop -->

# Install

```bash
npm install apitool --save
```

# Getting Started

## Performing a simple `GET` request

```js
import Api from 'apitool';

const result = await new Api().request("get", url);
// or
const result = await new Api().get(url);
```

You can, of course, put params like the following:

```js
const params = {
  ...
}

const result = await new Api().request("get", url, params);
// or
const result = await new Api().get(url, params);
```

## Performing a simple `POST` request

As you guess,

```js
const data = {
  ...
}

const result = await new Api().request("post", url, data);
// or
const result = await new Api().post(url, data);
```

`apitool` provides `get`, `post`, `put` and `delete`.

## `result` Schema

The request returns a `result`. It looks like the following:

```js
{
  // It indicates if error has occurred
  error: boolean;

  // It indicates what kind of error has occurred
  errorType?: ErrorType;

  // It holds an error code or any error-related data
  errorCode?: any;

  // A response object which has been transformed by your transformers.
  response?: T | undefined;

  // An original axios response object
  orgResponse?: AxiosResponse;
}
```

So after executing api call, you can handle error like this:

```js
const result = await new Api().get(url);
if (result.error) {
  // handleError with result.errorType and result.errorCode
} else {
  // do something with result.response
}
```

Or with object destructuring,

```js
const { error, errorType, errorCode, response } = await new Api().get(url);
if (error) {
  // handleError
} else {
  // do something
}
```

# Getting deeper

So far it doesn't seem to be different from `axios`. Here's an real life example to help you understand what `apitool` really exists for.

```js
const myApi = new Api().extend({
  baseURL: MY_DOMAIN,
  before: [
    () => showLoader()
  ],
  after: [
    () => hideLoader()
  ]
  transformData: [
    (data) => decamelizeKeys(data),
  ],
  transformResponse: [
    (response) => camelizeKeys(response),
  ]
})
```

In JavaScript people usually use camelCase and in rails or in some server-side languages they usually use snake_case. With `transformData` and `transformResponse`, you can convert cases easily. And unlike `axios`, `transformData` applies to all methods including `get`.

`before` and `after` helps you execute things before request and things after request.

With `apitool`, you can extend this.

```js
const myAuthApi = myApi.extend({
  headers: {
    Authorization: () => getAuthToken()
  },
  responseValidations: [
    async (response, context, orgResponse) => {
      if (!invalidAuth(orgResponse)) {
        return;
      }

      if (needToRefreshToken(orgResponse)) {
        await refreshToken();
        context.retry();
      } else {
        context.cancelAll();
        sendEventToRedirectToLogin();
      }
    },
    (response, context, orgResponse) => {
      if (!isOkay(orgResponse)) {
        context.error("not okay");
      }
    }
  ]
});
```

You can put `headers`. Each value could be a string or a function returning a string. When it's a function, it shouldn't be async.

Next, we see `responseValidations`. You can put an array of functions and they might be async or sync. Each function takes three arguments:

- `response` : A response object which has been transformed by your `transformResponse`.
- `context` : A context object with functions to be called when it's not successful.
  - `error(errorCode?: any)` : It returns an error. Once any of `error`, `retry` or `cancelAll` is called, then it will not execute next validation functions. However `after` callbacks will be still executed.
  - `retry(retryNum = 1)` : If you want to retry, call this function. The result from the retried request will be returned.
  - `cancelAll()` : It cancels all the other ongoing requests. For example, you can call this when user needs to be logged out due to expired token.
- `orgResponse` : An original axios response object

```js
const { error, errorType, errorCode, response, orgResponse } = await myAuthApi.get(path);
```

## `ErrorType` Schema

```js
enum ErrorType {
  // `retry()` has been called, it retried, but eventually failed
  // `errorCode` won't contain anything
  RETRY_DONE_FAILED,

  // `cancelAll()` has been called from this request
  // `errorCode` won't contain anything
  CANCELED_ALL,

  // `cancelAll()` has been called from other request, so this request has got canceled
  // `errorCode` won't contain anything
  GOT_CANCELED,

  // axios has thrown an exception
  // `errorCode` will contain exception object
  EXCEPTION,

  // `error()` has been called
  // `errorCode` will contain whatever you passed at `error(whatever)`
  USER_DEFINED_ERROR
}
```

## Combining configs

You can extend api objects like above, however there's another approach. You can combine configs and use it like the following:

```js
import { mergeConfigs } from "apitool";

const config1 = {
  baseURL: ...
  headers: {},
  transformData: []
  transformResponse: []
  before: []
  after: []
  responseValidations: []
};
const config2 = {...};
const config3 = {...};
const config = mergeConfigs(config1, config2, config3)

const api = new Api(config);
const result = await api.get(path);
```

## Importing things

All you can import from `apitool` is the following:

```js
import Api, { Response, Context, ErrorType, mergeConfigs } from "apitool";
```

## Contributing

1.  Fork it!
2.  Create your feature branch: git checkout -b my-new-feature
3.  Commit your changes: git commit -am 'Add some feature'
4.  Push to the branch: git push origin my-new-feature
5.  Submit a pull request :D

## Author

Eunjae Lee, Released under the [MIT](https://github.com/eunjae-lee/apitool/blob/master/LICENSE.md) License.
