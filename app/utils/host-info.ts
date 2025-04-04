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
	var os = OS;
	var version = DistroVersion;
	var kernel = OSVersion;
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
	const formattedOS = formatOS(os);

	// Trim in case OSVersion is empty
	return `${formattedOS} ${kernel ?? ''}`.trim();
}

function formatOS(os?: string) {
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
		case undefined:
			return 'Unknown';
		default:
			return os;
	}
}
