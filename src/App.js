import React, { useState, useEffect } from 'react'
import bridge from '@vkontakte/vk-bridge'
import '@vkontakte/vkui/dist/vkui.css'
import getComments from './utils/getComments'
import { Group, Panel, PanelHeader, ScreenSpinner, View, PanelSpinner, Link, Button, List, Cell, Avatar, Placeholder } from '@vkontakte/vkui'
import Icon56UsersOutline from '@vkontakte/icons/dist/56/users_outline'

const App = () => {
	const [comments, setComments] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		bridge.subscribe(({ detail: { type, data }}) => {
			if (type === 'VKWebAppUpdateConfig') {
				const schemeAttribute = document.createAttribute('scheme');
				schemeAttribute.value = data.scheme ? data.scheme : 'client_light';
				document.body.attributes.setNamedItem(schemeAttribute);
			}
		})

		async function fetchData() {
			const { access_token } = await bridge.send('VKWebAppGetAuthToken', {
				app_id: 7530639,
				scope: 'friends'
			})

			const commentsRes = await getComments(access_token, true)
			const friendsRes = await bridge.send('VKWebAppCallAPIMethod', {
				method: 'friends.areFriends',
				request_id: '1',
				params: {
					user_ids: commentsRes.map(item => item.from_id).join(','),
					need_sign: 0,
					v: '5.120',
					access_token,
				}
			})
			const friends = friendsRes.response
				.filter(item => item.friend_status === 3)
				.map(item => item.user_id)

			if (friends.length === 0) {
				setComments([])
				setLoading(false)
				return
			}

			const friendsComments = commentsRes.filter(item => friends.includes(item.from_id))
			const usersRes = await bridge.send('VKWebAppCallAPIMethod', {
				method: 'friends.areFriends',
				request_id: '2',
				params: {
					user_ids: friends.join(','),
					fields: 'photo_50',
					v: '5.120',
					access_token,
				}
			})

			const res = usersRes.response.reduce((acc, cur) => ([
				...acc, {
					user: cur,
					comment: friendsComments.find(item => item.from_id === cur.id),
				}
			]), [])

			setComments(res)
			setLoading(false)
		}

		fetchData()
	}, [])

	const popout = loading ? <ScreenSpinner size='large' /> : null

	const renderMoreButton = () => (
		<Button
			href='https://vk.com/topic-71768893_30336271'
			size='l'
			target='_parent'
		>
			Посмотреть все отзывы
		</Button>
	)

	return (
		<View activePanel='home' popout={ popout }>
			<Panel id='home'>
				<PanelHeader>Отзывы от ваших друзей</PanelHeader>
				{ comments === null && <PanelSpinner /> }

				{ comments !== null && comments.length === 0 && (
					<Placeholder
						icon={ <Icon56UsersOutline /> }
						action={ renderMoreButton() }
					>
						Отзывов от друзей пока нет
					</Placeholder>
				) }

				{ comments !== null && comments.length > 0 && (
					<Group>
						<List>
							{ comments.map(({ user, comment }) => (
								<Cell
									before={
										<Avatar
											src={ user.photo_50 }
											size={ 50 }
										/>
									}
									size='l'
									description={ comment.text }
									multiline={ true }
									bottomContent={
										<Link
											href={ `/topic-71768893_30336271?post=${ comment.id }` }
											target='_parent'
										>
											Посмотреть
										</Link>
									}
								>
									{ user.first_name } { user.last_name }
								</Cell>
							)) }
						</List>
						{ renderMoreButton() }
					</Group>
				) }
			</Panel>
		</View>
	)
}

export default App
