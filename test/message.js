const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const SlackTextMessage = require('../src/message.js').SlackTextMessage;
const TopicMessage = require('hubot/src/message.js').TopicMessage;
const hookModuleToReturnMockFromRequire = (module, mock) => {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function() {
    if (arguments[0] === module) {
      return mock;
    }
    return originalRequire.apply(this, arguments);
  };
};

const hubotSlackMock = require('../index.js');
const axiosMock = {
  default: {
    create() {
      
    }
  },
  headers: {
    post: {}
  }
};
hookModuleToReturnMockFromRequire('hubot-slack', hubotSlackMock);
hookModuleToReturnMockFromRequire('axios', axiosMock);

const SlackMention = require('../src/mention');


describe('buildText()', function() {
  let stubs, client, slacktextmessage, slacktextmessage_invalid_conversation;
  beforeEach(function() {
    ({ stubs, client, slacktextmessage, slacktextmessage_invalid_conversation } = require('./stubs.js')());
  });
  
  it('Should decode entities', async () => {
    let message = slacktextmessage;
    message.rawMessage.text = 'foo &gt; &amp; &lt; &gt;&amp;&lt;';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo > & < >&<');
  });

  it('Should remove formatting around <http> links', async () => {
    let message = slacktextmessage;
    message.rawMessage.text = 'foo <http://www.example.com> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo http://www.example.com bar');
  });

  it('Should remove formatting around <https> links', async () => {
    let message = slacktextmessage;
    message.rawMessage.text = 'foo <https://www.example.com> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo https://www.example.com bar');
  });

  it('Should remove formatting around <skype> links', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <skype:echo123?call> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo skype:echo123?call bar');
  });

  it('Should remove formatting around <https> links with a label', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <https://www.example.com|label> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo label (https://www.example.com) bar');
  });

  it('Should remove formatting around <https> links with a substring label', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <https://www.example.com|example.com> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo https://www.example.com bar');
  });

  it('Should remove formatting around <https> links with a label containing entities', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <https://www.example.com|label &gt; &amp; &lt;> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo label > & < (https://www.example.com) bar');
  });

  it('Should remove formatting around <mailto> links', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <mailto:name@example.com> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo name@example.com bar');
  });

  it('Should remove formatting around <mailto> links with an email label', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <mailto:name@example.com|name@example.com> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo name@example.com bar');
  });

  it('Should handle empty text with attachments', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = undefined;
    message.rawMessage.attachments = [
      { fallback: 'first' },
    ];
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, '\nfirst');
  });

  it('Should handle an empty set of attachments', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo';
    message.rawMessage.attachments = [];
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo');
  });

  it('Should change multiple links at once', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <@U123|label> bar <#C123> <!channel> <https://www.example.com|label>';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo @label bar #general @channel label (https://www.example.com)');
  });

  it('Should populate mentions with simple SlackMention object', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <@U123> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.mentions.length, 1);
    assert.deepEqual(message.mentions[0].type, 'user');
    assert.deepEqual(message.mentions[0].id, 'U123');
    assert.deepEqual((message.mentions[0] instanceof SlackMention), true);
  });

  it('Should populate mentions with simple SlackMention object with label', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <@U123|label> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.mentions.length, 1);
    assert.deepEqual(message.mentions[0].type, 'user');
    assert.deepEqual(message.mentions[0].id, 'U123');
    assert.deepEqual(message.mentions[0].info, undefined);
    assert.deepEqual((message.mentions[0] instanceof SlackMention), true);
  });

  it('Should populate mentions with multiple SlackMention objects', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <@U123> bar <#C123> baz <@U123|label> qux';
    message.text = await message.buildText(client);
    assert.deepEqual(message.mentions.length, 3);
    assert.deepEqual((message.mentions[0] instanceof SlackMention), true);
    assert.deepEqual((message.mentions[1] instanceof SlackMention), true);
    assert.deepEqual((message.mentions[2] instanceof SlackMention), true);
  });

  it('Should populate mentions with simple SlackMention object if user in brain', async () => {
    client.updateUserInBrain(stubs.user);
    const message = slacktextmessage;
    message.rawMessage.text = 'foo <@U123> bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.mentions.length, 1);
    assert.deepEqual(message.mentions[0].type, 'user');
    assert.deepEqual(message.mentions[0].id, 'U123');
    assert.deepEqual((message.mentions[0] instanceof SlackMention), true);
  });

  it('Should add conversation to cache', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo bar');
    assert.ok(Object.keys(client.channelData).includes('C123'));
  });

  it('Should not modify conversation if it is not expired', async () => {
    const message = slacktextmessage;
    client.channelData[stubs.channel.id] = {
      channel: {id: stubs.channel.id, name: 'baz'},
      updated: Date.now()
    };
    message.rawMessage.text = 'foo bar';
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo bar');
    assert.ok(Object.keys(client.channelData).includes('C123'));
    assert.deepEqual(client.channelData['C123'].channel.name, 'baz');
  });

  it('Should handle conversation errors', async () => {
    const message = slacktextmessage_invalid_conversation;
    message.rawMessage.text = 'foo bar';
    message.text = await message.buildText(client);
    client.robot.logger.logs != null ? assert.deepEqual(client.robot.logger.logs.error.length, 1) : undefined;
  });

  it('Should flatten attachments', async () => {
    const message = slacktextmessage;
    message.rawMessage.text = 'foo bar';
    message.rawMessage.attachments = [
      { fallback: 'first' },
      { fallback: 'second' }
    ];
    message.text = await message.buildText(client);
    assert.deepEqual(message.text, 'foo bar\nfirst\nsecond');
  });

  it('Should make a TopicMessage if subtype is channel_topic', async () => {
    const message = await SlackTextMessage.makeSlackTextMessage({}, null, null, {
      subtype: 'channel_topic',
      topic: 'foo'
    }, 'test', 'test-bot', null, null);
    assert.deepEqual(message instanceof TopicMessage, true);
  })
});


describe('replaceLinks()', () => {
  let stubs, client, slacktextmessage, slacktextmessage_invalid_conversation;
  beforeEach(() => {
    ({ stubs, client, slacktextmessage, slacktextmessage_invalid_conversation } = require('./stubs.js')());
  });
  
  it('Should change <@U123> links to @name', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <@U123> bar');
    assert.deepEqual(text, 'foo @name bar');
  });

  it('Should change <@U123|label> links to @label', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <@U123|label> bar');
    assert.deepEqual(text, 'foo @label bar');
  });

  it('Should handle invalid User ID gracefully', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <@U555> bar');
    assert.deepEqual(text, 'foo <@U555> bar');
  });

  it('Should handle empty User API response', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <@U789> bar');
    assert.deepEqual(text, 'foo <@U789> bar');
  });

  it('Should change <#C123> links to #general', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <#C123> bar');
    assert.deepEqual(text, 'foo #general bar');
  });

  it('Should change <#C123|label> links to #label', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <#C123|label> bar');
    assert.deepEqual(text, 'foo #label bar');
  });

  it('Should handle invalid Conversation ID gracefully', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <#C555> bar');
    assert.deepEqual(text, 'foo <#C555> bar');
  });

  it('Should handle empty Conversation API response', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <#C789> bar');
    assert.deepEqual(text, 'foo <#C789> bar');
  });

  it('Should change <!everyone> links to @everyone', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <!everyone> bar');
    assert.deepEqual(text, 'foo @everyone bar');
  });

  it('Should change <!channel> links to @channel', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <!channel> bar');
    assert.deepEqual(text, 'foo @channel bar');
  });

  it('Should change <!group> links to @group', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <!group> bar');
    assert.deepEqual(text, 'foo @group bar');
  });

  it('Should change <!here> links to @here', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <!here> bar');
    assert.deepEqual(text, 'foo @here bar');
  });

  it('Should change <!subteam^S123|@subteam> links to @subteam', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <!subteam^S123|@subteam> bar');
    assert.deepEqual(text, 'foo @subteam bar');
  });

  it('Should change <!foobar|hello> links to hello', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <!foobar|hello> bar');
    assert.deepEqual(text, 'foo hello bar');
  });

  it('Should leave <!foobar> links as-is when no label is provided', async () => {
    const text = await slacktextmessage.replaceLinks(client, 'foo <!foobar> bar');
    assert.deepEqual(text, 'foo <!foobar> bar');
  });
});
