# ts-http-client

`ts-http-client` makes `fetch()`ing easier. It supports caching, adding middleware, mocking api endpoints out of the box.

This package can be imported using ES6 imports and there's also a UMD bundle

### Sample Client initialization

```TypeScript
import {Client} from "../src/Client" // path to client
const client = new Client({baseUrl: "http://jsonplaceholder.typicode.com"});
```

### Making a request:
```TypeScript
import {Client} from "../src/Client";
import {FetchRequest, FetchResponse} from "../src/middlewares/Fetch";
const client = new Client({baseUrl: "http://jsonplaceholder.typicode.com"});
interface IPost {
    userId: number;
    id: number;
    title: string;
    body: string;
}
let response: Promise<FetchResponse<IPost>>;
response = (client.process({url: "/posts/1"} as FetchRequest));
response.then((res) => res.json()).then((res: IPost) => {
    console.log(res.id, res.userId, res.title, res.body);
});
```

Please note that once we initialize client with `baseUrl`, we can use relative paths there after.

### Adding a middleware
Adding a middleware is straight forward. We need a class which implements `IMiddleware`, then we pass in an instance of that class.

For example, let's implement json middleware which turns everything to json and get rid of two then calls

```TypeScript
import {IMiddleware} from "../src/Stack";
import {Client} from "../src/Client";
import {FetchRequest} from "../src/middlewares/Fetch";
const client = new Client({baseUrl: "http://jsonplaceholder.typicode.com"});
class JsonMw implements IMiddleware<any, any> {
    public process(options: any, next?: (nextOptions: any) => any): any {
        return next(options).json();
    }
}
client.addMiddleware(new JsonMw());
interface IPost {
    userId: number;
    id: number;
    title: string;
    body: string;
}
const response: Promise<IPost> = (client.process({url: "/posts/1"} as FetchRequest));
response.then((res) => {
    //noinspection TsLint
    console.log(res.id, res.userId, res.title, res.body);
});
```

### Mocking API endpoints
For testing needs, we also have a mock middleware. The usage is pretty straight forward.

Mocked response will be identical to real response and your application will behave exactly the same way

In addition to json middleware, Let's create a mock for two urls: `/posts/{id}` and `/users/{id}`

```TypeScript
import {Client} from "../src/Client";
import {FetchRequest} from "../src/middlewares/Fetch";
import {Mock} from "../src/middlewares/Mock";
import {IMiddleware} from "../src/Stack";
const client = new Client({baseUrl: "http://jsonplaceholder.typicode.com"});
interface IPost {
    userId: number;id: number;title: string;body: string;
}
interface ILocation {
    lat: string;lng: string;
}
interface IAddress {
    street: string;suite: string;city: string;zipcode: string;geo: ILocation;
}
interface ICompany {
    name: string;catchPhrase: string;bs: string;
}
interface IUser {
    id: number;name: string;username: string;email: string;
    address: IAddress;phone: string;website: string;company: ICompany;
}
const fakeUser: IUser = {
    id: 1,
    name: "Leanne Graham",
    username: "Bret",
    email: "Sincere@april.biz",
    address: {
        street: "Kulas Light",
        suite: "Apt. 556",
        city: "Gwenborough",
        zipcode: "92998-3874",
        geo: {
            lat: "-37.3159",
            lng: "81.1496"
        }
    },
    phone: "1-770-736-8031 x56442",
    website: "hildegard.org",
    company: {
        name: "Romaguera-Crona",
        catchPhrase: "Multi-layered client-server neural-net",
        bs: "harness real-time e-markets"
    }
};
const mock = new Mock();
mock.addHandler({
    delay: 100,
    resultFactory: (): IUser => {
        return fakeUser;
    },
    match: (options: FetchRequest): boolean => {
        return options.url.match(/\/users\/(\w+)/) !== null;
    }
});
mock.addHandler({
    delay: 100,
    resultFactory: (): IPost => {
        return {
            body: "quia et suscipit suscipit recusandae consequuntur",
            title: "my title",
            userId: 1,
            id: 1
        };
    },
    match: (options: FetchRequest): boolean => {
        return options.url.match(/\/posts\/(\w+)/) !== null;
    }
});

client.addMiddleware(mock);
class JsonMw implements IMiddleware<any, any> {
    public process(options: any, next?: (nextOptions: any) => any): any {
        return next(options).json();
    }
}
client.addMiddleware(new JsonMw());
const post: Promise<IPost> = (client.process({url: "/posts/1"} as FetchRequest));
post.then((res) => {
    //noinspection TsLint
    console.log(res.id, res.userId, res.title, res.body);
});

const user: Promise<IUser> = (client.process({url: "/posts/1"} as FetchRequest));
user.then((userData) => {
    //noinspection TsLint
    console.log(userData.id, userData.company, userData.username);
});
```
