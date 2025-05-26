import type { HostInfo } from '~/types';

export function getTSVersion(host: HostInfo) {
	const { IPNVersion } = host;
	if (!IPNVersion) {
		return 'Unknown';
	}

	// IPNVersion is <Semver>-<something>-<something>
	return IPNVersion.split('-')[0];
}

export function getOSInfo(host: HostInfo) {
	const { OS, OSVersion, Distro, DistroVersion } = host;
	let os = OS;
	let version = DistroVersion;
	const kernel = OSVersion;
	// OS follows runtime.GOOS but uses iOS and macOS instead of darwin
	if (OS === 'linux') {
		if (Distro && DistroVersion) {
			os = Distro;
			if (os === 'arch') {
				os = DistroVersion;
				version = undefined;
			} else {
				version = DistroVersion;
			}
		} else if (Distro && !DistroVersion) {
			os = Distro;
			version = undefined;
		}
	}
	const formattedOS = formatOS(os, true);

	// Trim in case OSVersion is empty
	return `${formattedOS} ${version ? version : kernel ? kernel : ''}`.trim();
}

function formatOS(os?: string, makeCapital?: boolean) {
	switch (os) {
		case 'macOS':
		case 'iOS':
			return os;
		case 'windows':
			return 'Windows';
		case 'linux':
			return 'Linux';
		case 'android':
			return 'Android';
		case 'openwrt':
			return 'OpenWRT';
		case undefined:
			return 'Unknown';
		default:
			return makeCapital ? os.charAt(0).toUpperCase() + os.slice(1) : os;
	}
}
