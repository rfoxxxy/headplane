// Roughly follows the DERPMap we get from the headplane agent
// https://github.com/tailscale/tailscale/blob/main/tailcfg/derpmap.go#L14

/**
 * DERPMap describes the set of DERP packet relay servers that are available.
 */
export interface DERPMap {
	/**
	 * HomeParams, if non-nil, is a change in home parameters.
	 * The rest of the DEPRMap fields, if zero, means unchanged.
	 */
	HomeParams?: DERPHomeParams;

	/**
	 * Regions is the set of geographic regions running DERP node(s).
	 * It's keyed by the DERPRegion.RegionID.
	 * The numbers are not necessarily contiguous.
	 */
	Regions: Record<number, DERPRegion>;

	/**
	 * OmitDefaultRegions specifies to not use Tailscale's DERP servers, and only use those
	 * specified in this DERPMap. If there are none set outside of the defaults, this is a noop.
	 * This field is only meaningful if the Regions map is non-nil (indicating a change).
	 */
	OmitDefaultRegions?: boolean;
}

/**
 * DERPHomeParams contains parameters from the server related to selecting a
 * DERP home region (sometimes referred to as the "preferred DERP").
 */
export interface DERPHomeParams {
	/**
	 * RegionScore scales latencies of DERP regions by a given scaling
	 * factor when determining which region to use as the home
	 * ("preferred") DERP. Scores in the range (0, 1) will cause this
	 * region to be proportionally more preferred, and scores in the range
	 * (1, ∞) will penalize a region.
	 *
	 * If a region is not present in this map, it is treated as having a
	 * score of 1.0.
	 *
	 * Scores should not be 0 or negative; such scores will be ignored.
	 *
	 * A nil map means no change from the previous value (if any); an empty
	 * non-nil map can be sent to reset all scores back to 1.0.
	 */
	RegionScore?: Record<number, number>;
}

/**
 * DERPRegion is a geographic region running DERP relay node(s).
 *
 * Client nodes discover which region they're closest to, advertise
 * that "home" DERP region (previously called "home node", when there
 * was only 1 node per region) and maintain a persistent connection
 * that region as long as it's the closest. Client nodes will further
 * connect to other regions as necessary to communicate with peers
 * advertising other regions as their homes.
 */
export interface DERPRegion {
	/**
	 * RegionID is a unique integer for a geographic region.
	 * It corresponds to the legacy derpN.tailscale.com hostnames
	 * used by older clients.
	 *
	 * RegionIDs must be non-zero, positive, and guaranteed to fit
	 * in a JavaScript number.
	 *
	 * RegionIDs in range 900-999 are reserved for end users to run their
	 * own DERP nodes.
	 */
	RegionID: number;

	/**
	 * RegionCode is a short name for the region. It's usually a popular
	 * city or airport code in the region: "nyc", "sf", "sin",
	 * "fra", etc.
	 */
	RegionCode: string;

	/**
	 * RegionName is a long English name for the region: "New York City",
	 * "San Francisco", "Singapore", "Frankfurt", etc.
	 */
	RegionName: string;

	/**
	 * Latitude, Longitude are optional geographical coordinates of the DERP region's city, in degrees.
	 */
	Latitude?: number;
	Longitude?: number;

	/**
	 * Avoid is whether the client should avoid picking this as its home
	 * region. The region should only be used if a peer is there.
	 * Clients already using this region as their home should migrate
	 * away to a new region without Avoid set.
	 */
	Avoid?: boolean;

	/**
	 * Nodes are the DERP nodes running in this region, in
	 * priority order for the current client. Client TLS
	 * connections should ideally only go to the first entry
	 * (falling back to the second if necessary). STUN packets
	 * should go to the first 1 or 2.
	 */
	Nodes: DERPNode[];
}

/**
 * DERPNode describes a DERP packet relay node running within a DERPRegion.
 */
export interface DERPNode {
	/**
	 * Name is a unique node name (across all regions).
	 * It is not a host name.
	 * It's typically of the form "1b", "2a", "3b", etc. (region
	 * ID + suffix within that region)
	 */
	Name: string;

	/**
	 * RegionID is the RegionID of the DERPRegion that this node
	 * is running in.
	 */
	RegionID: number;

	/**
	 * HostName is the DERP node's hostname.
	 * It is required but need not be unique; multiple nodes may
	 * have the same HostName but vary in configuration otherwise.
	 */
	HostName: string;

	/**
	 * CertName optionally specifies the expected TLS cert common
	 * name. If empty, HostName is used. If CertName is non-empty,
	 * HostName is only used for the TCP dial (if IPv4/IPv6 are
	 * not present) + TLS ClientHello.
	 */
	CertName?: string;

	/**
	 * IPv4 optionally forces an IPv4 address to use, instead of using DNS.
	 * If empty, A record(s) from DNS lookups of HostName are used.
	 * If the string is not an IPv4 address, IPv4 is not used; the
	 * conventional string to disable IPv4 (and not use DNS) is
	 * "none".
	 */
	IPv4?: string;

	/**
	 * IPv6 optionally forces an IPv6 address to use, instead of using DNS.
	 * If empty, AAAA record(s) from DNS lookups of HostName are used.
	 * If the string is not an IPv6 address, IPv6 is not used; the
	 * conventional string to disable IPv6 (and not use DNS) is
	 * "none".
	 */
	IPv6?: string;

	/**
	 * Port optionally specifies a STUN port to use.
	 * Zero means 3478.
	 * To disable STUN on this node, use -1.
	 */
	STUNPort?: number;

	/**
	 * STUNOnly marks a node as only a STUN server and not a DERP
	 * server.
	 */
	STUNOnly?: boolean;

	/**
	 * DERPPort optionally provides an alternate TLS port number
	 * for the DERP HTTPS server.
	 * If zero, 443 is used.
	 */
	DERPPort?: number;

	/**
	 * InsecureForTests is used by unit tests to disable TLS verification.
	 * It should not be set by users.
	 */
	InsecureForTests?: boolean;

	/**
	 * STUNTestIP is used in tests to override the STUN server's IP.
	 * If empty, it's assumed to be the same as the DERP server.
	 */
	STUNTestIP?: string;

	/**
	 * CanPort80 specifies whether this DERP node is accessible over HTTP
	 * on port 80 specifically. This is used for captive portal checks.
	 */
	CanPort80?: boolean;
}

/**
 * DERPAdmitClientRequest is the JSON request body of a POST to derper's
 * --verify-client-url admission controller URL.
 */
export interface DERPAdmitClientRequest {
	NodePublic: string; // key to query for admission
	Source: string; // derp client's IP address
}

/**
 * DERPAdmitClientResponse is the response to a DERPAdmitClientRequest.
 */
export interface DERPAdmitClientResponse {
	Allow: boolean; // whether to permit client
	// TODO: bandwidth limits, etc?
}
