import React, { useState, useEffect } from 'react'
import bridge from '@vkontakte/vk-bridge'
import '@vkontakte/vkui/dist/vkui.css'
import getComments from './utils/getComments'
import {
	Group,
	Panel,
	PanelHeader,
	ScreenSpinner,
	View,
	Link,
	Button,
	List,
	Cell,
	Avatar,
	Placeholder,
	Div,
	Header,
} from '@vkontakte/vkui'
import Icon56UsersOutline from '@vkontakte/icons/dist/56/users_outline'
import pluralForm from './utils/pluralForm'
import './App.css'

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
			// const { access_token } = await bridge.send('VKWebAppGetCommunityToken', {
			// 	app_id: 7530996,
			// 	group_id: 71768893,
			// 	scope: 'app_widget'
			// })

			const { access_token } = await bridge.send('VKWebAppGetAuthToken', {
				app_id: 7530996,
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

			console.log('friends', friends)

			if (friends.length === 0) {
				setComments([])
				setLoading(false)
				return
			}

			const friendsComments = commentsRes.filter(item => friends.includes(item.from_id))
			console.log('friendsComments', friendsComments)

			const usersRes = await bridge.send('VKWebAppCallAPIMethod', {
				method: 'users.get',
				request_id: '2',
				params: {
					user_ids: friends.join(','),
					fields: 'photo_100',
					v: '5.120',
					access_token,
				}
			})
			console.log('usersRes', usersRes)

			const res = friendsComments.reduce((acc, comment) => ([
				...acc, {
					user: usersRes.response.find(item => item.id === comment.from_id),
					comment,
				}
			]), [])
			console.log('res', res)

			setComments(res)
			setLoading(false)
		}

		fetchData()
	}, [])

	const popout = loading ? <ScreenSpinner size='large' /> : null

	const renderMoreButton = (size) => (
		<Button
			href='https://vk.com/topic-71768893_30336271'
			size={ size }
			target='_parent'
		>
			Посмотреть все отзывы
		</Button>
	)

	return (
		<View activePanel='home' popout={ popout }>
			<Panel id='home'>
				<PanelHeader>Отзывы от ваших друзей</PanelHeader>
				{ comments !== null && comments.length === 0 && (
					<Placeholder
						icon={ <Icon56UsersOutline /> }
						action={ renderMoreButton('l') }
					>
						Отзывов от друзей пока нет
					</Placeholder>
				) }

				{ comments !== null && comments.length > 0 && (
					<Group
						header={
							<Header mode='secondary'>
								Найдено { comments.length } { pluralForm(['отзыв', 'отзыва', 'отзывов'], comments.length) }
							</Header>
						}
					>
						<List>
							{ comments.map(({ user, comment }) => {
								const attachments = (comment.attachments || []).filter(item => item.type === 'photo')
								console.log('att', comment.attachments)
								return (
									<Cell
										key={ comment.id }
										before={
											<Avatar
												src={ user.photo_100 }
												size={ 50 }
											/>
										}
										size='l'
										description={
											<>
												<div>{ comment.text }</div>
												{ attachments.length > 0 && (
													<div className='attachments'>
														{ attachments.map(attachment => {
															const size = attachment.photo.sizes.find(item => item.type === 'x')
															if (!size) return null
															return (
																<img
																	src={ size.url }
																	width={ size.width / 2 }
																	height={ size.height / 2 }
																/>
															)
														}) }
													</div>
												)}
											</>
										}
										multiline={ true }
										bottomContent={
											<Link
												href={ `http://vk.com/topic-71768893_30336271?post=${ comment.id }` }
												target='_parent'
												className='open-comment'
											>
												Открыть
											</Link>
										}
									>
										{ user.first_name } { user.last_name }
									</Cell>
								)
							}) }
						</List>
						<Div>
							{ renderMoreButton('xl') }
						</Div>
					</Group>
				) }
			</Panel>
		</View>
	)
}

export default App
