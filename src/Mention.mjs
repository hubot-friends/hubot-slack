export class SlackMention {
	/**
	 * SlackMention is an instance of a mention within a SlackTextMessage.
	 * @constructor
	 * @param {string} id   - The user or conversation id that the mention references
	 * @param {string} type - The type of mention ('user' or 'conversation')
	 * @param {Object} info - An object with additional info about the message reference, not guaranteed
	 */
	constructor(id, type, info) {
		this.id = id;
		this.type = type;
		this.info = info ?? undefined;
	}
}
