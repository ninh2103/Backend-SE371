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
import { commentRouter } from './routes/comments.routes'
import { sharesRouter } from './routes/shares.routes'
const app = express()
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
app.listen(port, () => {
  console.log(`Dang Chay tren Port ${port}`)
})
