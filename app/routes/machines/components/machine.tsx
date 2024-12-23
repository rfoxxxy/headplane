import { ChevronDownIcon, CopyIcon } from "@primer/octicons-react";
import { Link } from "@remix-run/react";

import Menu from "~/components/Menu";
import StatusCircle from "~/components/StatusCircle";
import { toast } from "~/components/Toaster";
import { Machine, Route, User } from "~/types";
import { cn } from "~/utils/cn";

import MenuOptions from "./menu";

interface Props {
	readonly machine: Machine;
	readonly routes: Route[];
	readonly users: User[];
	readonly magic?: string;
}

export default function MachineRow({ machine, routes, magic, users }: Props) {
	const expired =
		machine.expiry === "0001-01-01 00:00:00" ||
		machine.expiry === "0001-01-01T00:00:00Z" ||
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		machine.expiry === null
			? false
			: new Date(machine.expiry).getTime() < Date.now();

	const expiryDisabled =
		machine.expiry === "0001-01-01 00:00:00" ||
		machine.expiry === "0001-01-01T00:00:00Z" ||
		machine.expiry === null
			? true
			: false;

	// eslint-disable-next-line @stylistic/max-statements-per-line
	const exitNode =
		routes.some((route) => {
			return route.prefix === "0.0.0.0/0" && route.enabled;
		}) &&
		routes.some((route) => {
			return route.prefix === "::/0" && route.enabled;
		});

	let tags = [...machine.forcedTags, ...machine.validTags];

	tags = [...new Set(tags)];

	const prefix = magic?.startsWith("[user]")
		? magic.replace("[user]", machine.user.name)
		: magic;

	// This is much easier with Object.groupBy but it's too new for us
	const { exit, subnet, subnetApproved } = routes.reduce(
		(acc, route) => {
			if (route.prefix === "::/0" || route.prefix === "0.0.0.0/0") {
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
		tags.unshift("Exit Node");
	}

	if (subnetApproved.length > 0) {
		tags.unshift("Subnets");
	}

	if (expiryDisabled) {
		tags.unshift("Expiry disabled");
	}

	if (expired) {
		tags.unshift(
			`Expired ${new Date(machine.expiry).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric" })}`,
		);
	}

	return (
		<tr
			key={machine.id}
			className="hover:bg-zinc-100 dark:hover:bg-zinc-800 group"
		>
			<td className="pl-0.5 py-2">
				<Link to={`/machines/${machine.id}`} className="group/link h-full">
					<p
						className={cn(
							"font-semibold leading-snug",
							"group-hover/link:text-blue-600",
							"group-hover/link:dark:text-blue-400",
						)}
					>
						{machine.givenName}
					</p>
					<p className="text-sm text-gray-500 dark:text-gray-300 font-mono">
						{machine.user.email ||
							machine.user.displayName ||
							machine.user.name}{" "}
						• {machine.name}
					</p>
					<div className="flex gap-1 mt-1">
						{tags.map((tag) => (
							<span
								key={tag}
								className={cn(
									"text-xs rounded-md px-1.5 py-0.5",
									"bg-ui-200 dark:bg-ui-800",
									"text-ui-600 dark:text-ui-300",
								)}
							>
								{tag}
							</span>
						))}
					</div>
				</Link>
			</td>
			<td className="py-2">
				<div className="flex items-center gap-x-1">
					{machine.ipAddresses[0]}
					<Menu>
						<Menu.Button>
							<ChevronDownIcon className="w-4 h-4" />
						</Menu.Button>
						<Menu.Items>
							{magic ? (
								<Menu.ItemButton
									type="button"
									className={cn(
										"flex items-center gap-x-1.5 text-sm",
										"justify-between w-full break-keep",
									)}
									// eslint-disable-next-line @typescript-eslint/no-misused-promises
									onPress={async () => {
										const ip = machine.givenName;
										await navigator.clipboard.writeText(ip);
										toast("Copied short domain to clipboard");
									}}
								>
									{machine.givenName}
									<CopyIcon className="w-3 h-3" />
								</Menu.ItemButton>
							) : undefined}
							{magic ? (
								<Menu.ItemButton
									type="button"
									className={cn(
										"flex items-center gap-x-1.5 text-sm",
										"justify-between w-full break-keep",
									)}
									// eslint-disable-next-line @typescript-eslint/no-misused-promises
									onPress={async () => {
										// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
										const ip = `${machine.givenName}.${prefix}`;
										await navigator.clipboard.writeText(ip);
										toast("Copied full domain to clipboard");
									}}
								>
									{machine.givenName}.{prefix}
									<CopyIcon className="w-3 h-3" />
								</Menu.ItemButton>
							) : undefined}
							{machine.ipAddresses.map((ip) => (
								<Menu.ItemButton
									key={ip}
									type="button"
									className={cn(
										"flex items-center gap-x-1.5 text-sm",
										"justify-between w-full",
									)}
									// eslint-disable-next-line @typescript-eslint/no-misused-promises
									onPress={async () => {
										// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
										await navigator.clipboard.writeText(ip);
										toast("Copied IP address to clipboard");
									}}
								>
									{ip}
									<CopyIcon className="w-3 h-3" />
								</Menu.ItemButton>
							))}
						</Menu.Items>
					</Menu>
				</div>
			</td>
			<td className="py-2">
				<span
					className={cn(
						"flex items-center gap-x-1 text-sm",
						"text-gray-500 dark:text-gray-400",
					)}
				>
					<StatusCircle
						isOnline={machine.online && !expired}
						className="w-4 h-4"
					/>
					<p>
						{machine.online && !expired
							? "Connected"
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
