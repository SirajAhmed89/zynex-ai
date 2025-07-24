'use client'

import { supabaseClient as supabase } from './supabase-client'
import { Chat } from '@/home-components/homepage'
import { Message } from '@/home-components/messages'

export interface DbChat {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface DbMessage {
  id: string
  chat_id: string
  content: string
  message_type: 'user' | 'assistant' | 'system' | 'error'
  content_type: 'text' | 'code' | 'markdown' | 'html' | 'json'
  metadata: unknown
  created_at: string
}

// Interface for messages returned from join queries (without chat_id)
export interface PartialDbMessage {
  id: string
  content: string
  message_type: 'user' | 'assistant' | 'system' | 'error'
  content_type: 'text' | 'code' | 'markdown' | 'html' | 'json'
  metadata: unknown
  created_at: string
}

export interface DbProfile {
  id: string
  name: string | null
  email: string | null
  dob: string | null
  created_at: string
  updated_at: string | null
}

// Chat Operations
export class ChatService {
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  static async getAllChats(): Promise<Chat[]> {
    const user = await this.getCurrentUser()
    if (!user) return []

    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (
          id,
          content,
          message_type,
          content_type,
          metadata,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching chats:', error)
      return []
    }

    return chats?.map(chat => ({
      id: chat.id,
      title: chat.title,
      createdAt: new Date(chat.created_at),
      updatedAt: new Date(chat.updated_at),
      messages: chat.messages?.map((msg: PartialDbMessage) => ({
        id: msg.id,
        content: msg.content,
        role: msg.message_type,
        timestamp: new Date(msg.created_at)
      })) || []
    })) || []
  }

  static async createChat(title: string, firstMessage: Message): Promise<string | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    // Start a transaction
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert([{
        user_id: user.id,
        title: title
      }])
      .select()
      .single()

    if (chatError) {
      console.error('Error creating chat:', chatError)
      return null
    }

    // Add the first message
    const { error: messageError } = await supabase
      .from('messages')
      .insert([{
        chat_id: chat.id,
        content: firstMessage.content,
        message_type: firstMessage.role,
        content_type: 'text'
      }])

    if (messageError) {
      console.error('Error creating first message:', messageError)
      // Try to clean up the chat if message creation failed
      await supabase.from('chats').delete().eq('id', chat.id)
      return null
    }

    return chat.id
  }

  static async addMessage(chatId: string, message: Message): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false

    // Verify the chat belongs to the user
    const { data: chat } = await supabase
      .from('chats')
      .select('user_id')
      .eq('id', chatId)
      .single()

    if (!chat || chat.user_id !== user.id) {
      console.error('Chat not found or unauthorized')
      return false
    }

    const { error } = await supabase
      .from('messages')
      .insert([{
        chat_id: chatId,
        content: message.content,
        message_type: message.role,
        content_type: 'text'
      }])

    if (error) {
      console.error('Error adding message:', error)
      return false
    }

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    return true
  }

  static async updateChatTitle(chatId: string, newTitle: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false

    const { error } = await supabase
      .from('chats')
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', chatId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating chat title:', error)
      return false
    }

    return true
  }

  static async deleteChat(chatId: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false

    // Messages will be automatically deleted due to cascade delete
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting chat:', error)
      return false
    }

    return true
  }

  static async getChatById(chatId: string): Promise<Chat | null> {
    const user = await this.getCurrentUser()
    if (!user) return null

    const { data: chat, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        messages (
          id,
          content,
          message_type,
          content_type,
          metadata,
          created_at
        )
      `)
      .eq('id', chatId)
      .eq('user_id', user.id)
      .order('created_at', { foreignTable: 'messages', ascending: true })
      .single()

    if (error) {
      console.error('Error fetching chat:', error)
      return null
    }

    return {
      id: chat.id,
      title: chat.title,
      createdAt: new Date(chat.created_at),
      updatedAt: new Date(chat.updated_at),
      messages: chat.messages?.map((msg: PartialDbMessage) => ({
        id: msg.id,
        content: msg.content,
        role: msg.message_type,
        timestamp: new Date(msg.created_at)
      })) || []
    }
  }
}

// Profile Operations
export class ProfileService {
  static async getCurrentUserProfile(): Promise<DbProfile | null> {
    const user = await ChatService.getCurrentUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return profile
  }

  static async updateProfile(updates: Partial<Pick<DbProfile, 'name' | 'dob'>>): Promise<boolean> {
    const user = await ChatService.getCurrentUser()
    if (!user) return false

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      return false
    }

    return true
  }

  static async ensureProfileExists(): Promise<boolean> {
    const user = await ChatService.getCurrentUser()
    if (!user) return false

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return true // Profile already exists
    }

    // Create profile if it doesn't exist
    const { error } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || null
      }])

    if (error) {
      console.error('Error creating profile:', error)
      return false
    }

    return true
  }
}
