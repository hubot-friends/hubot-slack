// If you want to use this, you have to `npm install proxy-agent` and uncomment the import statement below
// import { ProxyAgent  } from 'proxy-agent'
export default async robot => {
    robot.logger.info(`This is an example showing how to configure a proxy for the Slack Adapter's Web Client to use.`)
    robot.config = {
        // agent: new ProxyAgent(),
    }
}