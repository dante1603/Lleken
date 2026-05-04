export default function handler(_request: any, response: any) {
  response.status(200).json({
    results: [
      {
        id: 'santiago-cl',
        name: 'Santiago',
        displayName: 'Santiago, Region Metropolitana de Santiago, Chile',
        lat: -33.45694,
        lon: -70.64827,
        country: 'Chile',
        admin1: 'Region Metropolitana de Santiago',
      },
    ],
  });
}
