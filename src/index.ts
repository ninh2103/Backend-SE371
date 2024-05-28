import express from 'express'
import userRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHanddler } from './middlewares/error.middleware'
import { initFoder } from './utils/file'
import { mediasRouter } from './routes/medias.routes'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRouter from './routes/static.routes'
import { postsRouter } from './routes/posts.routes'
import { likesRouter } from './routes/likes.routes'
import cors from 'cors'
import { commentRouter } from './routes/comments.routes'
import { sharesRouter } from './routes/shares.routes'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import { groupRouter } from './routes/group.routes'
import { conversationsRouter } from './routes/conversations.routes'
import Conversation from './models/schemas/Conversation.schema'
import { ConversationStatus } from './constants/enums'
import { ObjectId } from 'mongodb'

const app = express()
const httpServer = createServer(app)
app.use(cors())
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})
// app.use(express.json({ limit: '50mb' })) // Tăng giới hạn kích thước payload cho JSON
// app.use(express.urlencoded({ limit: '50mb', extended: true }))
const port = 4000
initFoder()
app.use(express.json())
app.use('/users', userRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/medias', express.static(UPLOAD_IMAGE_DIR))
app.use('/posts', postsRouter)
app.use('/likes', likesRouter)
app.use('/comments', commentRouter)
app.use('/shares', sharesRouter)
app.use('/groups', groupRouter)
app.use('/conversations', conversationsRouter)

// app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

databaseService.connect()
databaseService.indexUsers()
databaseService.indexRefreshToken()
databaseService.indexFriends()
app.use(defaultErrorHanddler)

const users: {
  [key: string]: {
    socket_id: string
  }
} = {}
io.on('connection', (socket: Socket) => {
  console.log(`user ${socket.id} connect`)
  const user_id = socket.handshake.auth._id
  console.log('user_id', user_id)
  users[user_id] = {
    socket_id: socket.id
  }
  console.log(users)

  socket.on('private_message', async (data) => {
    const socket_reciver_id = users[data.to]?.socket_id
    if (!socket_reciver_id) {
      return
    }
    await databaseService.conversations.insertOne(
      new Conversation({
        sender_id: new ObjectId(data.from),
        receiver_id: new ObjectId(data.to),
        content: data.content,
        conversation_Type: ConversationStatus.Private
      })
    )
    socket.to(socket_reciver_id).emit('reciver_message', {
      content: data.content,
      from: user_id
    })
  })
  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`user ${socket.id} disconnect`)
    console.log(users)
  })
})
httpServer.listen(port, () => {
  console.log(`Dang Chay tren Port ${port}`)
})
