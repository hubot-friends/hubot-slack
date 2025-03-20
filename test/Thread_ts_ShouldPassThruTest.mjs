import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SlackBot, SlackClient } from '../src/Bot.mjs'
import hubotSlackMock from '../index.mjs'
import { loadBot, Robot } from 'hubot'
import { SlackTextMessage, ReactionMessage, FileSharedMessage } from '../src/Message.mjs'
import EventEmitter from 'node:events'

class SocketModeClientMock extends EventEmitter{
    constructor() {
        super()
    }

    send() {
        return Promise.resolve()
    }
}

class WebClientMock extends EventEmitter{
    constructor(api) {
        super()
        Object.keys(api).forEach((key) => {
            this[key] = api[key]
        })
    }
}

describe('thread_ts should pass thru', () => {
    it('Message should include thread_ts if present', async () => {
        const user = { id
            : 'U12345678', name: 'testuser' }
        const text = 'Hello, world!'
        const rawText = 'Hello, world!'
        const rawMessage = {
            type: 'message',
            user: user.id,
            text: rawText,
            ts: '1234567890.123456',
            thread_ts: '1234567890.123456'
        }
        const channel_id = 'C12345678'
        const robot_name = 'testbot'
        const robot_alias = 'testbot_alias'
        const envelope = {
            user: user,
            message: rawMessage,
            room: channel_id
        }
        const message = {
            text: text,
            user: user.id,
            room: channel_id,
            thread_ts: '1234567890.123456'
        }
        const msg = new SlackTextMessage(user, text, rawText, rawMessage, channel_id, robot_name, robot_alias)
        const sut = new SlackClient({}, new Robot('TestBot', 'testbot', 'testbot_alias'), new SocketModeClientMock(), new WebClientMock({
            chat: {
                postMessage: async (params) => {
                    assert.strictEqual(params.thread_ts, '1234567890.123456')
                    return { ok: true, ts: '1234567890.123456' }
                }
            }
        }))
        await sut.send(envelope, message)
    })

    it('Message send a text only message', async () => {
        const user = { id
            : 'U12345678', name: 'testuser' }
        const text = 'Hello, world!'
        const rawText = 'Hello, world!'
        const rawMessage = {
            type: 'message',
            user: user.id,
            text: rawText,
            ts: '1234567890.123456',
            thread_ts: '1234567890.123456'
        }
        const channel_id = 'C12345678'
        const robot_name = 'testbot'
        const robot_alias = 'testbot_alias'
        const envelope = {
            user: user,
            message: rawMessage,
            room: channel_id
        }
        const message = text
        const msg = new SlackTextMessage(user, text, rawText, rawMessage, channel_id, robot_name, robot_alias)
        const sut = new SlackClient({}, new Robot('TestBot', 'testbot', 'testbot_alias'), new SocketModeClientMock(), new WebClientMock({
            chat: {
                postMessage: async (param) => {
                    assert.strictEqual(param.text, 'Hello, world!')
                    return { ok: true, param }
                }
            }
        }))
        await sut.send(envelope, message)
    })

})
