import styled from "styled-components";

export const Container = styled.div`
  width: 500px;
  background-color: rgba(255, 255, 255, 0.8);
  border-right: 1px solid #e8e8e8;
  overflow: hidden;
  position: absolute;
  left: 291px;
  z-index: 1;
  height: calc(100vh - 114px);

  .ant-tree {
    background-color: transparent;
  }
`;
