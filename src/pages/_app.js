import "../styles/globals.css";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Head from "next/head";

import styles from "../styles/Simplepedia.module.css";

function MainApp({ Component, pageProps }) {

  const props = {
    ...pageProps,
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Simplepedia</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1 className="title">Simplepedia</h1>
        <Component {...props} />
      </main>

      <footer>CS 312 Assignment 4</footer>
    </div>
  );
}

export default MainApp;

MainApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.shape({}),
};
