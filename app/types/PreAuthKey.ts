export interface PreAuthKey {
	id: string;
	key: string;
	user: string;
	username: string;
	reusable: boolean;
	ephemeral: boolean;
	used: boolean;
	expiration: string;
	createdAt: string;
	aclTags: string[];
}
