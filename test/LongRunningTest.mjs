import test, { beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { Robot, TextMessage, User } from 'hubot'

import adapter from '../index.mjs'

await test('long running script test', { timeout: 30 * 1000 }, async t => {
  await t.test('Should dedup messages', (t, done) => {
    const robot = new Robot(adapter, false, 'gbot')
    let counter = 0
    const user = new User('1', { name: 'node', room: '#test' })

    robot.respond(/long running script/, async (res) => {
      counter++
      await new Promise(resolve => setTimeout(resolve, 5000))
      await robot.shutdown()
      assert.deepEqual(counter, 1)
      done()
    })


    robot.loadAdapter().then(() => {
      robot.on('connected', async () => {
        const message = {"envelope_id":"72aacfb0-aad6-4c8b-a2ac-7cde07f1a6cd","body":{"token":"asdf","team_id":"T171Q1SD7","context_team_id":"T171Q1SD7","context_enterprise_id":null,"api_app_id":"asdf","event":{"user":"U1718U2F6","type":"message","ts":"1740253370.552849","client_msg_id":"556ed1b7-4e51-48d7-9145-767143917e96","text":"@gbot long running script","team":"T171Q1SD7","blocks":[{"type":"rich_text","block_id":"X6Saf","elements":[{"type":"rich_text_section","elements":[{"type":"user","user_id":"U08EXU91JNM"},{"type":"text","text":" long running script"}]}]}],"channel":"C08F8S31MNC","event_ts":"1740253370.552849","channel_type":"channel"},"type":"event_callback","event_id":"Ev08EH8M45HT","event_time":1740253370,"authorizations":[{"enterprise_id":null,"team_id":"T171Q1SD7","user_id":"U08EXU91JNM","is_bot":true,"is_enterprise_install":false}],"is_ext_shared_channel":false,"event_context":"4-asdf"},"event":{"user":"U1718U2F6","type":"message","ts":"1740253370.552849","client_msg_id":"556ed1b7-4e51-48d7-9145-767143917e96","text":"@gbot long running script","team":"T171Q1SD7","blocks":[{"type":"rich_text","block_id":"X6Saf","elements":[{"type":"rich_text_section","elements":[{"type":"user","user_id":"U08EXU91JNM"},{"type":"text","text":" long running script"}]}]}],"channel":"C08F8S31MNC","event_ts":"1740253370.552849","channel_type":"channel"},"retry_num":0,"retry_reason":"","accepts_response_payload":false}
        robot.adapter.eventHandler(message)
        setTimeout(async () => {
          robot.adapter.eventHandler({ ...message, retry_num: 1, retry_reason: 'timeout' })
        }, 1000)
      })
  
    })
    .then(() => {
      robot.run().then().catch(console.error)
    })
    .catch(console.error)
  })

})