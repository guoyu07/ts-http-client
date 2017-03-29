import {Client} from "../src/Client";
import {FetchRequest} from "../src/middlewares/Fetch";
import {Mock} from "../src/middlewares/Mock";
import {IMiddleware} from "../src/Stack";
const client = new Client({baseUrl: "http://jsonplaceholder.typicode.com"});
interface IPost {
    userId: number;
    id: number;
    title: string;
    body: string;
}
interface ILocation {
    lat: string;
    lng: string;
}

interface IAddress {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: ILocation;
}
interface ICompany {
    name: string;
    catchPhrase: string;
    bs: string;
}
interface IUser {
    id: number;
    name: string;
    username: string;
    email: string;
    address: IAddress;
    phone: string;
    website: string;
    company: ICompany;
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
