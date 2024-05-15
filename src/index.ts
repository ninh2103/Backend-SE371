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

const app = express()
const httpServer = createServer(app)
app.use(cors())
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

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

// app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))

databaseService.connect()
databaseService.indexUsers()
databaseService.indexRefreshToken()
databaseService.indexFriends()
app.use(defaultErrorHanddler)

// const users: {
//   [key: string]: {
//     socket_id: string
//   }
// } = {}
// io.on('connection', (socket: Socket) => {
//   console.log(`user ${socket.id} connect`)
//   const user_id = socket.handshake.auth._id
//   console.log('user_id', user_id)
//   users[user_id] = {
//     socket_id: socket.id
//   }
//   console.log(users)

//   socket.on('private_message', (data) => {
//     const socket_reciver_id = users[data.to]?.socket_id
//     if (!socket_reciver_id) {
//       return
//     }
//     socket.to(socket_reciver_id).emit('reciver_message', {
//       content: data.content,
//       from: user_id
//     })
//   })
//   socket.on('disconnect', () => {
//     delete users[user_id]
//     console.log(`user ${socket.id} disconnect`)
//     console.log(users)
//   })
// })
// httpServer.listen(port, () => {
//   console.log(`Dang Chay tren Port ${port}`)
// })
httpServer.listen(port, () => {
  console.log(`Dang Chay tren Port ${port}`)
})
