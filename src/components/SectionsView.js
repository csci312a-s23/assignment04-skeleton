/*
  SectionsView.js

  This module displays the sections and reports when a user clicks on one.

  props:
    sections - an array of section names
    selectSection - a callback that expects a section as an argument

*/
import styles from "../styles/SectionsView.module.css";

export default function SectionsView({ sections, selectSection }) {
  return <div className={styles.sectionList}>Sections go here</div>;
}
