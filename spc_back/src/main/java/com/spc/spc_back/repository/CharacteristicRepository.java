package com.spc.spc_back.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.spc.spc_back.entity.spcdata.Characteristic;
import com.spc.spc_back.mapper.CharacteristicMapper;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class CharacteristicRepository {
    private final CharacteristicMapper characteristicMapper;

    public int insertCharacteristic(Characteristic characteristic) {
        return characteristicMapper.insertCharacteristic(characteristic);
    }

    public Optional<Characteristic> selectCharacteristicByCharId(Long charId) {
        return Optional.ofNullable(characteristicMapper.selectCharacteristicByCharId(charId));
    }

    public Optional<List<Characteristic>> selectCharacteristicListByProjId(Long projId) {
        return Optional.ofNullable(characteristicMapper.selectCharacteristicListByProjId(projId));
    }

    public int updateCharacteristic(Characteristic characteristic) {
        return characteristicMapper.updateCharacteristic(characteristic);
    }

    public int deleteCharacteristic(Long charId) {
        return characteristicMapper.deleteCharacteristic(charId);
    }
}
