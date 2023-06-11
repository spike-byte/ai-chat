import { createServer } from "http"
import axios from "axios"
import "dotenv/config"
import { SocksProxyAgent } from "socks-proxy-agent"
import { Stream } from "stream"
import { createReadStream } from "fs"

const api = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_TOKEN}`
  },
  httpsAgent: new SocksProxyAgent(process.env.SOCKS_PROXY!)
})

createServer(async (req, res) => {
  const url = new URL(req.url!, "file:///")
  const query = Object.fromEntries(url.searchParams.entries())

  switch (url.pathname) {
    case "/":
      createReadStream("./index.html").pipe(res)
      break

    case "/chat":
      // 设置支持es通信
      res.setHeader("Content-Type", "text/event-stream")

      if (!query.promat) {
        res.statusCode = 400
        res.end(
          JSON.stringify({
            message: "请输入你的问题"
          })
        )
      }

      const { data } = await api.post<Stream>(
        "/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: query.promat }],
          max_tokens: 100,
          stream: true
        },
        {
          responseType: "stream"
        }
      )
      data.pipe(res)
      break

    default:
      res.end("")
  }
}).listen(9001)
