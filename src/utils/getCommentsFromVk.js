import bridge from '@vkontakte/vk-bridge'

const COUNT = 100

const getCommentsFromVk = async (access_token, offset = 0) => {
  const { response } = await bridge.send('VKWebAppCallAPIMethod', {
    method: 'board.getComments',
    request_id: '1',
    params: {
      group_id: 71768893, // https://vk.com/academy_mebel29
      topic_id: 30336271, // https://vk.com/topic-71768893_30336271
      count: COUNT,
      offset,
      extended: 0,
      v: '5.120',
      access_token,
    }
  })

  const hasMore = response.count > offset + COUNT
  if (hasMore) {
    const nextItems = await getCommentsFromVk(access_token, offset + COUNT)
    return [...response.items, ...nextItems]
  }

  return response.items
}

export default getCommentsFromVk
