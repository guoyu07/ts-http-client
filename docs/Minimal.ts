import {Client} from "../src/Client";
import {FetchRequest, FetchResponse} from "../src/middlewares/Fetch";
const client = new Client({baseUrl: "http://jsonplaceholder.typicode.com"});
interface IPost {
    userId: number;
    id: number;
    title: string;
    body: string;
}
const response: Promise<FetchResponse<IPost>> = (client.process({url: "/posts/1"} as FetchRequest));
response.then((res) => res.json()).then((res) => {
    //noinspection TsLint
    console.log(res.id, res.userId, res.title, res.body);
});
