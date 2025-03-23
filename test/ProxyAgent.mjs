import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SlackBot, SlackClient } from '../src/Bot.mjs'
import hubotSlackMock from '../index.mjs'
import { loadBot, Robot } from 'hubot'
import { SlackTextMessage, ReactionMessage, FileSharedMessage } from '../src/Message.mjs'
import EventEmitter from 'node:events'
import { ProxyAgent } from 'proxy-agent'
import { WebClient } from '@slack/web-api'

class SocketModeClientMock extends EventEmitter{
    constructor() {
        super()
    }

    send() {
        return Promise.resolve()
    }
}

class WebClientMock extends WebClient{
    constructor(token, options) {
        super(token, options)
    }
}

describe('Proxy support', () => {
    it('Pass through an agent optiont to the WebClient', async () => {
        const robot = new Robot('TestBot', 'testbot', 'testbot_alias')
        robot.config = {
            agent: new ProxyAgent()
        }
        const sut = new SlackClient({}, robot, new SocketModeClientMock(), new WebClientMock(null, {
            agent: robot.config.agent
        }))
        assert.equal(robot.agent, sut.web.agent)
    })

})
