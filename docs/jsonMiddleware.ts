import {Client} from "../src/Client";
import {FetchRequest} from "../src/middlewares/Fetch";
import {IMiddleware} from "../src/Stack";
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
