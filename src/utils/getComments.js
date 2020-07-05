import cachedComments from './cachedComments.json'
import getCommentsFromVk from './getCommentsFromVk'

const getComments = async (access_token, fromCache) => {
  if (fromCache) return cachedComments
  return getCommentsFromVk(access_token)
}

export default getComments
