// Conversation modes.
export const MODE_CHAT = 0;
export const MODE_CHANNEL_PRIVATE = 1;
export const MODE_CHANNEL_PUBLIC = 2;
export const MODE_NAME = {
  [MODE_CHAT]: `Chat`,
  [MODE_CHANNEL_PRIVATE]: `Private Channel`,
  [MODE_CHANNEL_PUBLIC]: `Public Channel`
};
export const MODE_SHORT_NAME = {
  [MODE_CHAT]: `Chat`,
  [MODE_CHANNEL_PRIVATE]: `Channel`,
  [MODE_CHANNEL_PUBLIC]: `Channel`
};
export const MODE_DESCRIPTION = {
  [MODE_CHAT]: `Chat messages are end to end encrypted per-user. Message decryption keys are copied and encrypted for each person in the chat. If someone is added to a chat later, they won't be able to read any previous messages.`,
  [MODE_CHANNEL_PRIVATE]: `Private channel messages are end to end encrypted per-channel. Message decryption keys are derived from the channel's encryption key, which is encrypted for each person. If someone is added to a private channel later, they will be able to read all of the previous messages in the channel.`,
  [MODE_CHANNEL_PUBLIC]: `Public channel messages are not encrypted. Anyone can search for a public channel and read its messages before joining or requesting to join.`
};
// Notification settings.
export const NOTIFICATIONS_ALL = 0;
export const NOTIFICATIONS_MENTIONS = 1;
export const NOTIFICATIONS_DIRECT = 2;
export const NOTIFICATIONS_NONE = 4;
export const NOTIFICATIONS_NAME = {
  [NOTIFICATIONS_ALL]: `Every Message`,
  // [NOTIFICATIONS_MENTIONS]: `Mentions and Broadcasts (@here)`,
  // [NOTIFICATIONS_DIRECT]: `Only Mentions`,
  [NOTIFICATIONS_NONE]: `No Notifications`
};
