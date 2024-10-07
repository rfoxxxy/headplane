/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CheckCircleIcon, NoEntryIcon } from '@primer/octicons-react'
import { ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'

import Attribute from '~/components/Attribute'
import Card from '~/components/Card'
import StatusCircle from '~/components/StatusCircle'
import { type Machine, Route, User } from '~/types'
import { cn } from '~/utils/cn'
import { loadContext } from '~/utils/config/headplane'
import { loadConfig } from '~/utils/config/headscale'
import { pull } from '~/utils/headscale'
import { getSession } from '~/utils/sessions'
import { useLiveData } from '~/utils/useLiveData'

import { menuAction } from './_data.machines._index/action'
import MenuOptions from './_data.machines._index/menu'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const session = await getSession(request.headers.get('Cookie'))
	if (!params.id) {
		throw new Error('No machine ID provided')
	}

	const context = await loadContext()
	let magic: string | undefined

	if (context.config.read) {
		const config = await loadConfig()
		if (config.dns.magic_dns) {
			magic = config.dns.base_domain
		}
	}

	const [machine, routes, users] = await Promise.all([
		pull<{ node: Machine }>(`v1/node/${params.id}`, session.get('hsApiKey')!),
		pull<{ routes: Route[] }>('v1/routes', session.get('hsApiKey')!),
		pull<{ users: User[] }>('v1/user', session.get('hsApiKey')!),
	])

	return {
		machine: machine.node,
		routes: routes.routes.filter(route => route.node.id === params.id),
		users: users.users,
		magic,
	}
}

export async function action({ request }: ActionFunctionArgs) {
	return menuAction(request)
}

export default function Page() {
	const { machine, magic, routes, users } = useLoaderData<typeof loader>()
	useLiveData({ interval: 1000 })

	const expired = machine.expiry === '0001-01-01 00:00:00'
		|| machine.expiry === '0001-01-01T00:00:00Z'
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		|| machine.expiry === null
		? false
		: new Date(machine.expiry).getTime() < Date.now()

	let tags = [
		...machine.forcedTags,
		...machine.validTags,
	]

	if (expired) {
		tags.unshift('Expired')
	}

	tags = [...new Set(tags)]

	return (
		<div>
			<p className="mb-8 text-md">
				<Link
					to="/machines"
					className="font-medium"
				>
					All Machines
				</Link>
				<span className="mx-2">
					/
				</span>
				{machine.givenName}
			</p>
			<div className="flex justify-between items-center">
				<span className="flex items-baseline gap-x-4 text-sm mb-4">
					<h1 className="text-2xl font-medium">
						{machine.givenName}
					</h1>
					<StatusCircle isOnline={machine.online} className="w-4 h-4" />
				</span>

				<MenuOptions
					machine={machine}
					routes={routes}
					users={users}
					magic={magic}
				/>
			</div>
			<div className="flex gap-1 mt-1 mb-8">
				{tags.map(tag => (
					<span
						key={tag}
						className={cn(
							'text-xs rounded-md px-1.5 py-0.5',
							'bg-ui-200 dark:bg-ui-800',
							'text-ui-600 dark:text-ui-300',
						)}
					>
						{tag}
					</span>
				))}
			</div>
			<h2 className="text-xl font-medium mb-4">
				Machine Details
			</h2>
			<Card variant="flat" className="w-full max-w-full">
				<Attribute name="Creator" value={machine.user.name} />
				<Attribute name="Machine Name" value={machine.givenName} />
				<Attribute isCopyable name="Hostname" value={machine.name} />
				<Attribute name="ID" value={machine.id} />
				<Attribute
					isCopyable
					name="Node Key"
					value={machine.nodeKey}
				/>
				<Attribute
					name="Created"
					value={new Date(machine.createdAt).toLocaleString()}
				/>
				<Attribute
					name="Last Seen"
					value={new Date(machine.lastSeen).toLocaleString()}
				/>
				<Attribute
					name="Key expiry"
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					value={machine.expiry === '0001-01-01 00:00:00' || machine.expiry === '0001-01-01T00:00:00Z' || machine.expiry === null ? 'No expiry' : new Date(machine.expiry).toLocaleString()}
				/>
				{magic
					? (
						<Attribute
							isCopyable
							name="Domain"
							value={`${machine.givenName}.${magic}`}
						/>
						)
					: undefined}
				<Attribute
					isCopyable
					name="Tailscale IPv4"
					value={machine.ipAddresses[0]}
				/>
				{machine.ipAddresses.length > 1
					? (
						<Attribute
							isCopyable
							name="Tailscale IPv6"
							value={machine.ipAddresses[1]}
						/>
						)
					: undefined}
			</Card>
			<h2 className="text-xl font-medium mb-0 mt-8">
				Routing Settings
			</h2>
			<h5 className="text-sm font-normal text-gray-400 mb-3 mt-1.5">
				Let this device route traffic for your tailnet.
			</h5>
			<Card variant="flat" className="w-full max-w-full">
				<div
					className={cn(
						'flex items-center justify-between',
						'border-ui-100 dark:border-ui-800',
					)}
				>
					<div>
						<p className="font-medium mb-1">
							Exit Node
						</p>
						<p className="text-sm text-ui-600 dark:text-ui-300">
							{routes.some((route) => { return route.prefix === '0.0.0.0/0' && route.enabled })
							&& routes.some((route) => { return route.prefix === '::/0' && route.enabled })
								? (
										(
											<p>
												<CheckCircleIcon />
												{' '}
												Allowed
											</p>
										)
									)
								: (
									<p>
										<NoEntryIcon />
										{' '}
										Not Allowed
									</p>
									)}
						</p>
					</div>
				</div>
			</Card>
			<h2 className="text-xl font-medium mb-0 mt-8">
				Subnets
			</h2>
			<h5 className="text-sm font-normal text-gray-400 mb-3 mt-1.5">
				Subnets let you expose physical network routes onto Tailscale.
			</h5>
			<Card variant="flat" className="w-full max-w-full">
				{routes.filter((route) => { return route.prefix !== '0.0.0.0/0' && route.prefix !== '::/0' }).length === 0
					? (
						<div
							className={cn(
								'flex py-4 px-4',
								'items-center justify-center',
								'text-ui-600 dark:text-ui-300',
							)}
						>
							<p>
								No routes are advertised on this machine.
							</p>
						</div>
						)
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					: routes.filter((route) => { return route.prefix !== '0.0.0.0/0' && route.prefix !== '::/0' }).map((route, _i) => (
						<div
							key={route.id}
							className={cn(
								'flex items-center justify-between',
								'border-ui-100 dark:border-ui-800',
								'space-y-1',
							)}
						>
							<div>
								<p className="font-mono mb-1">
									{route.prefix}
								</p>
								<p className="text-sm text-ui-600 dark:text-ui-300">
									{' '}
									(Created:
									{' '}
									{new Date(route.createdAt).toLocaleString()}
									)
								</p>
							</div>
							<div className="text-right">
								<p className="mb-1">
									{route.enabled ? 'Enabled' : 'Disabled'}
								</p>
								<p className="text-sm text-ui-600 dark:text-ui-300">
									{route.isPrimary ? 'Primary' : 'Secondary'}
								</p>
							</div>
						</div>
					))}
			</Card>
		</div>
	)
}
