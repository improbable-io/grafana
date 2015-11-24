package sqlstore
import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
)

func makeCert(tlsPoolName string, config MySQLConfig) (*tls.Config, error) {
	rootCertPool := x509.NewCertPool()
	pem, err := ioutil.ReadFile(config.CaPath)
	if err != nil {
		return nil, err
	}
	if ok := rootCertPool.AppendCertsFromPEM(pem); !ok {
		return nil, err
	}
	clientCert := make([]tls.Certificate, 0, 1)
	certs, err := tls.LoadX509KeyPair(config.ClientCertPath, config.ClientKeyPath)
	if err != nil {
		return nil, err
	}
	clientCert = append(clientCert, certs)
	tlsConfig := &tls.Config{
		RootCAs:      rootCertPool,
		Certificates: clientCert,
	}
	if config.ServerName != "" {
		tlsConfig.ServerName = config.ServerName
	}

	if config.UseTls == "skip-verify" {
		tlsConfig.InsecureSkipVerify = true
	}
	return tlsConfig, nil
}

