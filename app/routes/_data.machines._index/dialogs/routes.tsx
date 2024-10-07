import { useFetcher } from '@remix-run/react'
import { type Dispatch, type SetStateAction } from 'react'

import Dialog from '~/components/Dialog'
import Switch from '~/components/Switch'
import { type Machine, type Route } from '~/types'
import { cn } from '~/utils/cn'

interface RoutesProps {
	readonly machine: Machine
	readonly routes: Route[]
	readonly state: [boolean, Dispatch<SetStateAction<boolean>>]
}

// TODO: Support deleting routes
export default function Routes({ machine, routes, state }: RoutesProps) {
	const fetcher = useFetcher()

	return (
		<Dialog>
			<Dialog.Panel control={state}>
				{close => (
					<>
						<Dialog.Title>
							Edit route settings of
							{' '}
							{machine.givenName}
						</Dialog.Title>
						<Dialog.Text>
							<p className="text-base font-medium mb-0 mt-0">
								Subnet routes
							</p>
						</Dialog.Text>
						<Dialog.Text>
							<p className="text-sm font-normal mb-0 mt-1">
								Connect to devices you can&apos;t install Tailscale on
								by advertising IP ranges as subnet routes.
							</p>
						</Dialog.Text>
						<div className={cn(
							'rounded-lg overflow-y-auto my-2',
							'divide-y divide-zinc-200 dark:divide-zinc-700 align-top',
							'border border-zinc-200 dark:border-zinc-700',
						)}
						>
							{routes.filter((route) => { return route.prefix !== '0.0.0.0/0' && route.prefix !== '::/0' }).length === 0
								? (
									<div
										className={cn(
											'flex py-4 px-4 bg-ui-100 dark:bg-ui-800',
											'items-center justify-center',
											'text-ui-600 dark:text-ui-300',
										)}
									>
										<p>
											No routes are advertised on this machine.
										</p>
									</div>
									)
								: undefined}
							{routes.filter((route) => { return route.prefix !== '0.0.0.0/0' && route.prefix !== '::/0' }).map(route => (
								<div
									key={route.node.id}
									className={cn(
										'flex py-2 px-4 bg-ui-100 dark:bg-ui-800',
										'items-center justify-between',
									)}
								>
									<p>
										{route.prefix}
									</p>
									<Switch
										defaultSelected={route.enabled}
										label="Enabled"
										onChange={(checked) => {
											const form = new FormData()
											form.set('id', machine.id)
											form.set('_method', 'routes')
											form.set('route', route.id)

											form.set('enabled', String(checked))
											fetcher.submit(form, {
												method: 'POST',
											})
										}}
									/>
								</div>
							))}
						</div>
						<Dialog.Text>
							<p className="text-base font-medium mb-0 mt-2">
								Exit Node
							</p>
						</Dialog.Text>
						<Dialog.Text>
							<p className="text-sm font-normal mb-0 mt-1">
								Allow your network to route internet traffic through this machine.
							</p>
						</Dialog.Text>
						<div className={cn(
							'rounded-lg overflow-y-auto my-2',
							'divide-y divide-zinc-200 dark:divide-zinc-700 align-top',
							'border border-zinc-200 dark:border-zinc-700',
						)}
						>
							<div
								className={cn(
									'flex py-2 px-4 bg-ui-100 dark:bg-ui-800',
									'items-center justify-between',
								)}
							>
								<p>
									Use as exit node
								</p>
								<Switch
									isDisabled={!(routes.some((route) => { return route.prefix === '0.0.0.0/0' })
									&& routes.some((route) => { return route.prefix === '::/0' }))}
									defaultSelected={routes.some((route) => { return route.prefix === '0.0.0.0/0' && route.enabled })
									&& routes.some((route) => { return route.prefix === '::/0' && route.enabled })}
									label="Enabled"
									onChange={(checked) => {
										const form = new FormData()
										form.set('id', machine.id)
										form.set('_method', 'routes')
										// eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
										form.set('route', routes.find(route => route.prefix === '0.0.0.0/0')?.id as string)

										form.set('enabled', String(checked))
										fetcher.submit(form, {
											method: 'POST',
										})
										// eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
										form.set('route', routes.find(route => route.prefix === '::/0')?.id as string)
										fetcher.submit(form, {
											method: 'POST',
										})
									}}
								/>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-2 mt-6">
							<Dialog.Action
								variant="cancel"
								isDisabled={fetcher.state === 'submitting'}
								onPress={close}
							>
								Close
							</Dialog.Action>
						</div>
					</>
				)}
			</Dialog.Panel>
		</Dialog>
	)
}
