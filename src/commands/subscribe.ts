import { Telegraf, ContextMessageUpdate } from 'telegraf'
import { checkIfAdmin } from '../helpers/checkAdmin'
import { findChat } from '../models/chat'
import { loc } from '../helpers/locale'

export function setupSubscribe(bot: Telegraf<ContextMessageUpdate>) {
  bot.command('subscribe', async ctx => {
    if (ctx.chat.type === 'private') {
      const chat = await findChat(ctx.chat.id)
      ctx.reply(loc('no_work_private', chat.language))
      return
    }
    // Check if admin
    const isAdmin = await checkIfAdmin(ctx)
    if (!isAdmin) return
    // Get chat
    let chat = await findChat(ctx.chat.id)
    // Check format
    const subscribeString = (ctx.message || ctx.channelPost).text
      .substr(11)
      .trim()
      .replace('@', '')
    if (!subscribeString) {
      return ctx.reply(loc('subscribe_format', chat.language), {
        disable_notification: true,
      })
    }
    // Check if bot is admin in this chat
    try {
      const chatAdmins = await ctx.getChatAdministrators()
      const isBotAdmin = chatAdmins
        .map(m => m.user.username)
        .includes(bot.options.username)
      if (!isBotAdmin) {
        throw new Error()
      }
    } catch (err) {
      return ctx.reply(loc('bot_not_admin', chat.language), {
        disable_notification: true,
      })
    }
    // Check if bot is admin in subscribe chat
    try {
      const subscribeChatAdmins = await ctx.telegram.getChatAdministrators(
        subscribeString
      )
      const isBotAdmin = subscribeChatAdmins
        .map(m => m.user.username)
        .includes(bot.options.username)
      if (!isBotAdmin) {
        throw new Error()
      }
    } catch (err) {
      return ctx.reply(
        `${loc('bot_not_admin_chat', chat.language)}@${subscribeString}`,
        {
          disable_notification: true,
        }
      )
    }
    // Add subscibe string
    chat.subscribe = subscribeString
    await chat.save()
    // Report success
    return ctx.reply(
      `${loc('subscribe_success', chat.language)}@${subscribeString}`,
      {
        disable_notification: true,
      }
    )
  })
}
