import { ChevronDownIcon, CopyIcon } from '@primer/octicons-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import Chip from '~/components/Chip';
import Menu from '~/components/Menu';
import StatusCircle from '~/components/StatusCircle';
import type { HostInfo, Machine, Route, User } from '~/types';
import cn from '~/utils/cn';
import * as hinfo from '~/utils/host-info';

import toast from '~/utils/toast';
import MenuOptions from './menu';

interface Props {
	machine: Machine;
	routes: Route[];
	users: User[];
	magic?: string;
	stats?: HostInfo;
}

export default function MachineRow({
	machine,
	routes,
	magic,
	users,
	stats,
}: Props) {
	const expired =
		machine.expiry === '0001-01-01 00:00:00' ||
		machine.expiry === '0001-01-01T00:00:00Z' ||
		machine.expiry === null
			? false
			: new Date(machine.expiry).getTime() < Date.now();

	const expiryDisabled =
		machine.expiry === "0001-01-01 00:00:00" ||
		machine.expiry === "0001-01-01T00:00:00Z" ||
		machine.expiry === null
			? true
			: false;

	let tags = [...new Set([...machine.forcedTags, ...machine.validTags])];

	const prefix = magic?.startsWith('[user]')
		? magic.replace('[user]', machine.user.name)
		: magic;

	// This is much easier with Object.groupBy but it's too new for us
	const { exit, subnet, subnetApproved } = routes.reduce<{
		exit: Route[];
		subnetApproved: Route[];
		subnet: Route[];
	}>(
		(acc, route) => {
			if (route.prefix === '::/0' || route.prefix === '0.0.0.0/0') {
				acc.exit.push(route);
				return acc;
			}

			if (route.enabled) {
				acc.subnetApproved.push(route);
				return acc;
			}

			acc.subnet.push(route);
			return acc;
		},
		{ exit: [], subnetApproved: [], subnet: [] },
	);

	const exitEnabled = useMemo(() => {
		if (exit.length !== 2) return false;
		return exit[0].enabled && exit[1].enabled;
	}, [exit]);

	if (exitEnabled) {
		tags.unshift('Exit Node');
	}

	if (subnetApproved.length > 0) {
		tags.unshift('Subnets');
	}

	if (expiryDisabled) {
		tags.unshift("Expiry disabled");
	}

	if (expired) {
		tags.unshift(
			`Expired ${new Date(machine.expiry).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric" })}`,
		);
	}

	tags = [...new Set(tags)];

	const ipOptions = useMemo(() => {
		if (magic) {
			return [...machine.ipAddresses, `${machine.givenName}.${prefix}`];
		}

		return machine.ipAddresses;
	}, [magic, machine.ipAddresses]);

	return (
		<tr
			key={machine.id}
			className="'group hover:bg-headplane-50 dark:hover:bg-headplane-950"
		>
			<td className="pl-0.5 py-2 focus-within:none">
				<Link
					to={`/machines/${machine.id}`}
					className={cn('group/link h-full focus:outline-none')}
				>
					<p
						className={cn(
							'font-semibold leading-snug',
							'group-hover/link:text-headplane-800',
							'group-hover/link:dark:text-headplane-300',
						)}
					>
						{machine.givenName}
					</p>
					<p className="text-sm font-mono opacity-50">
						{machine.user.email ||
							machine.user.displayName ||
							machine.user.name}
						{" "}•{" "}
						{machine.name}
					</p>
					<div className="flex gap-1 mt-1">
						{tags.map((tag) => (
							<Chip key={tag} text={tag} />
						))}
					</div>
				</Link>
			</td>
			<td className="py-2">
				<div className="flex items-center gap-x-1">
					{machine.ipAddresses[0]}
					<Menu placement="bottom end">
						<Menu.IconButton className="bg-transparent" label="IP Addresses">
							<ChevronDownIcon className="w-4 h-4" />
						</Menu.IconButton>
						<Menu.Panel
							onAction={async (key) => {
								await navigator.clipboard.writeText(key.toString());
								toast('Copied IP address to clipboard');
							}}
						>
							<Menu.Section>
								{ipOptions.map((ip) => (
									<Menu.Item key={ip} textValue={ip}>
										<div
											className={cn(
												'flex items-center justify-between',
												'text-sm w-full gap-x-6',
											)}
										>
											{ip}
											<CopyIcon className="w-3 h-3" />
										</div>
									</Menu.Item>
								))}
							</Menu.Section>
						</Menu.Panel>
					</Menu>
				</div>
			</td>
			{/**
			<td className="py-2">
					{stats !== undefined ? (
						<>
						<p className="leading-snug">
							{hinfo.getTSVersion(stats)}
						</p>
						<p className="text-sm opacity-50 max-w-48 truncate">
							{hinfo.getOSInfo(stats)}
						</p>
						</>
					) : (
						<p className="text-sm opacity-50">
							Unknown
						</p>
					)}
			</td>
			**/}
			<td className="py-2">
				<span
					className={cn(
						'flex items-center gap-x-1 text-sm',
						'text-headplane-600 dark:text-headplane-300',
					)}
				>
					<StatusCircle
						isOnline={machine.online && !expired}
						className="w-4 h-4"
					/>
					<p>
						{machine.online && !expired
							? 'Connected'
							: `${new Date(machine.lastSeen).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric" })} at ${new Date(machine.lastSeen).toLocaleString(undefined, { hour: "numeric", minute: "numeric", timeZoneName: "short" })}`}
					</p>
				</span>
			</td>
			<td className="py-2 pr-0.5">
				<MenuOptions
					machine={machine}
					routes={routes}
					users={users}
					magic={magic}
				/>
			</td>
		</tr>
	);
}
