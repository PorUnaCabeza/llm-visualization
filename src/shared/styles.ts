export const COLORS = {
  bg: '#1c1c1c',
  blue: '#58C4DD',
  green: '#83C167',
  yellow: '#FFFF00',
  red: '#FC6255',
  purple: '#9A72AC',
  orange: '#FF8C00',
  white: '#FFFFFF',
  gray: '#888888',
  dimWhite: '#CCCCCC',
  gold: '#F4D03F',
};

export const PAGE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: ${COLORS.bg};
    font-family: 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    color: ${COLORS.white};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  h1 {
    font-size: 24px;
    font-weight: 300;
    margin: 20px 0 10px;
    color: ${COLORS.dimWhite};
    letter-spacing: 1px;
  }
  .subtitle {
    font-size: 14px;
    color: ${COLORS.gray};
    margin-bottom: 20px;
  }
  #container {
    border: 1px solid #333;
    border-radius: 8px;
    overflow: hidden;
  }
  .controls {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
  }
  button {
    padding: 8px 20px;
    background: #333;
    border: 1px solid #555;
    border-radius: 6px;
    color: ${COLORS.white};
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  button:hover { background: #444; border-color: ${COLORS.blue}; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  .nav-back {
    position: fixed;
    top: 16px;
    left: 16px;
    text-decoration: none;
    color: ${COLORS.gray};
    font-size: 14px;
    transition: color 0.2s;
  }
  .nav-back:hover { color: ${COLORS.blue}; }
`;
