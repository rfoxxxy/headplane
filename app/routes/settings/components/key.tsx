import Attribute from "~/components/Attribute";
import Button from "~/components/Button";
import Code from "~/components/Code";
import { toast } from "~/components/Toaster";
import type { PreAuthKey, User } from "~/types";

import ExpireKey from "../dialogs/expire";

interface Props {
	authKey: PreAuthKey;
	user: User;
	server: string;
}

export default function AuthKeyRow({ authKey, user, server }: Props) {
	const createdAt = `${new Date(authKey.createdAt).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric" })} at ${new Date(authKey.createdAt).toLocaleString(undefined, { hour: "numeric", minute: "numeric", timeZoneName: "short" })}`;
	const expiration = `${new Date(authKey.expiration).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric" })} at ${new Date(authKey.expiration).toLocaleString(undefined, { hour: "numeric", minute: "numeric", timeZoneName: "short" })}`;

	return (
		<div className="w-full">
			<Attribute name="Key" value={authKey.key} isCopyable />
			<Attribute name="User" value={authKey.user} isCopyable />
			<Attribute name="Reusable" value={authKey.reusable ? "Yes" : "No"} />
			<Attribute name="Ephemeral" value={authKey.ephemeral ? "Yes" : "No"} />
			{!authKey.reusable && (
				<Attribute name="Used" value={authKey.used ? "Yes" : "No"} />
			)}
			<Attribute name="Created" value={createdAt} />
			<Attribute name="Expiration" value={expiration} />
			<p className="mb-1 mt-4">
				To use this key, run the following command on your device:
			</p>
			<Code className="text-sm">
				tailscale up --login-server {server} --authkey {authKey.key}
			</Code>
			<div className="flex gap-4 items-center">
				{authKey.used ||
				new Date(authKey.expiration) < new Date() ? undefined : (
					<ExpireKey authKey={authKey} user={user} />
				)}
				<Button
					variant="light"
					className="my-4"
					onPress={async () => {
						await navigator.clipboard.writeText(
							`tailscale up --login-server ${server} --authkey ${authKey.key}`,
						);

						toast("Copied command to clipboard");
					}}
				>
					Copy Tailscale Command
				</Button>
			</div>
		</div>
	);
}
